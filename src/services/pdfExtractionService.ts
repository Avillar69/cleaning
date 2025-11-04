import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

const API_KEY = "AIzaSyA-Smt1RXoLHh__9DjSt4378_BmPaBDDmA" as string;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface ExtractedServiceData {
  workOrder: string;
  scheduledDate: string; // YYYY-MM-DD format
  serviceType: string;
  unitName: string;
}

export interface UnitValidationResult {
  isValid: boolean;
  unitId?: string;
  unitName?: string;
  error?: string;
}

export class PDFExtractionService {
  private static normalizeUnitString(value: string): string {
    return (value || '').toLowerCase().replace(/\s+/g, '');
  }

  private static async extractTextFromPDF(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          
          // Convertir el ArrayBuffer a Uint8Array
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Extraer texto del PDF
          const text = await this.extractTextFromPDFBuffer(uint8Array);
          resolve(text);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extrae múltiples servicios desde un PDF que contiene una tabla con filas de servicios.
   * Cada fila debe incluir: workOrder, scheduledDate (YYYY-MM-DD), serviceType, unitName
   */
  public static async extractMultipleServicesFromPDF(file: File): Promise<ExtractedServiceData[]> {
    try {
      return await this.extractMultipleServicesFromPDFWithGemini(file);
    } catch (error) {
      console.warn('Error con Gemini, intentando método alternativo:', error);
      return await this.extractMultipleServicesFromPDFFallback(file);
    }
  }

  private static async extractMultipleServicesFromPDFWithGemini(file: File): Promise<ExtractedServiceData[]> {
    // 1) Obtener texto del PDF
    const rawText = await this.extractTextFromPDF(file);
    console.log('✅ Texto extraído (bulk) - primeros 1000 chars:\n', rawText.slice(0, 1000));
    console.log('Longitud total del texto extraído (bulk):', rawText.length);

    const maxChars = 50000;
    const inputText = rawText.length > maxChars ? rawText.slice(0, maxChars) : rawText;
    if (rawText.length > maxChars) {
      console.log(`⚠️ Texto del PDF (bulk) truncado a ${maxChars} caracteres (original: ${rawText.length}).`);
    }

    // 2) Pedir a Gemini que detecte la tabla y devuelva un JSON array estricto
    const prompt = `
Eres un extractor de datos. Del siguiente contenido de un PDF que contiene una TABLA de servicios de limpieza,
identifica las filas y devuelve SOLO un arreglo JSON (sin texto adicional) donde cada elemento tenga exactamente:
{
  "workOrder": string | null,
  "scheduledDate": string | null, // formato YYYY-MM-DD
  "serviceType": string | null,
  "unitName": string | null
}

Reglas:
- Si falta algún dato en la fila, usa null.
- La fecha debe estar en formato YYYY-MM-DD si existe.
- No agregues campos extra ni comentarios.
- Devuelve únicamente un JSON array válido.
- El tipo de servicio devuelvelo tal cual lo encuentras en el PDF.

Contenido del PDF:
${inputText}
`;

    // Implementar retry con backoff exponencial
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, topK: 1, topP: 1, maxOutputTokens: 8192 }
          })
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          const errorMessage = `API request failed: ${response.status} ${response.statusText}${errText ? ' - ' + errText : ''}`;
          
          // Si es 503 (overloaded) o 429 (rate limit), intentar de nuevo
          if ((response.status === 503 || response.status === 429) && attempt < maxRetries) {
            console.log(`Intento ${attempt} falló con ${response.status}, reintentando en ${attempt * 2} segundos...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 2000)); // Backoff exponencial
            continue;
          }
          
          throw new Error(errorMessage);
        }

        // Si llegamos aquí, la respuesta fue exitosa
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        console.log('=== RESPUESTA GEMINI (BULK) ===');
        console.log('Longitud de la respuesta:', text.length);
        console.log('Respuesta completa:', text);
        console.log('Primeros 500 caracteres:', text.slice(0, 500));
        console.log('Últimos 500 caracteres:', text.slice(-500));
        console.log('===============================');

        // Extraer un JSON array
        const match = text.match(/\[[\s\S]*\]/);
        if (!match) {
          throw new Error('No se encontró un arreglo JSON en la respuesta del modelo.');
        }
        let jsonString = match[0];
        let parsed: any[] = [];
        try {
          parsed = JSON.parse(jsonString);
        } catch (e) {
          console.error('Error al parsear JSON bulk:', e);
          throw new Error('No se pudo parsear el arreglo JSON devuelto por el modelo.');
        }

        // Normalizar y tipar
        const result: ExtractedServiceData[] = parsed.map((row) => ({
          workOrder: row?.workOrder ?? '',
          scheduledDate: row?.scheduledDate ?? '',
          serviceType: row?.serviceType ?? '',
          unitName: row?.unitName ?? ''
        }));

        console.log('Filas bulk normalizadas:', result);
        return result;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`Intento ${attempt} falló:`, error);
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    throw new Error(`Error después de ${maxRetries} intentos: ${lastError?.message || 'Error desconocido'}`);
  }

  private static async extractTextFromPDFBuffer(buffer: Uint8Array): Promise<string> {
    try {
      // Configurar el worker correctamente (v4 usa .mjs). Vite resolverá la URL en build.
      if (!GlobalWorkerOptions.workerSrc) {
        const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url);
        GlobalWorkerOptions.workerSrc = workerUrl.toString();
      }

      const loadingTask = getDocument({ data: buffer });
      const pdf = await loadingTask.promise;

      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = (textContent.items as any[])
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText;
    } catch (error) {
      console.error('Error detallado al extraer PDF:', error);
      throw new Error('Error al extraer texto del PDF: ' + error);
    }
  }

  public static async extractServiceDataFromPDF(file: File): Promise<ExtractedServiceData> {
    try {
      // Extraer texto del PDF
      let pdfText = '';
      
      try {
        pdfText = await this.extractTextFromPDF(file);
        console.log('✅ Texto extraído del PDF exitosamente');
        console.log('--- DEBUG PDF.js (primeros 1000 caracteres) ---');
        console.log(pdfText.slice(0, 1000));
        console.log('Longitud total del texto extraído:', pdfText.length);
        if (pdfText.length > 1000) {
          console.log('Nota: mostrando solo un fragmento.');
        }
      } catch (pdfError) {
        console.warn('❌ Error al extraer texto del PDF, usando método alternativo:', pdfError);
        // Método alternativo: usar solo el nombre del archivo
        pdfText = `Nombre del archivo PDF: ${file.name}`;
        console.log('📄 Usando nombre del archivo como fuente de datos');
        console.log('📁 Nombre del archivo:', file.name);
      }
      
      if (!API_KEY) {
        throw new Error('API key no configurada. Define GEMINI_API_KEY en tu entorno.');
      }

      const maxChars = 50000;
      const inputText = pdfText.length > maxChars ? pdfText.slice(0, maxChars) : pdfText;
      if (pdfText.length > maxChars) {
        console.log(`⚠️ Texto del PDF truncado a ${maxChars} caracteres para el envío a Gemini (longitud original: ${pdfText.length}).`);
      }

      // Enviar a Google Gemini para extraer datos
      const prompt = `
        Analiza el siguiente texto extraído de un PDF de orden de trabajo de limpieza y extrae los siguientes datos en formato JSON:

        Texto del PDF:
        ${inputText}

        Extrae y devuelve únicamente un objeto JSON con la siguiente estructura:
        {
          "workOrder": "número de orden de trabajo",
          "scheduledDate": "fecha de programación en formato YYYY-MM-DD",
          "serviceType": "tipo de servicio (ej: limpieza regular, limpieza profunda, etc.)",
          "unitName": "nombre de la unidad/propiedad"
        }

        Reglas importantes:
        - Si no encuentras algún campo, usa null para ese valor
        - La fecha debe estar en formato YYYY-MM-DD
        - El workOrder debe ser el número exacto de la orden
        - El unitName debe ser el nombre exacto de la unidad/propiedad (busca campos como "Unit:", "Unidad:", "Property:", etc.)
        - El serviceType debe ser descriptivo del tipo de servicio (busca campos como "Clean Type:", "Service Type:", "Tipo de Servicio:", etc.)
        - Si encuentras un campo "Unit" con un valor como "East Ashley Avenue 0618 - Jangada Breeze", ese es el unitName
        - Si encuentras un campo "Unit Address" con una dirección completa, puedes usar parte de esa información para el unitName
        - Si solo tienes el nombre del archivo, NO uses palabras genéricas como "Work Order", "Track", "Software", etc.
        - Busca específicamente direcciones (ej: "618 East Ashley Ave"), nombres de propiedades (ej: "Jangada Breeze"), o códigos de unidad
        - Si el nombre del archivo no contiene información específica de la unidad, usa null para unitName
        - Devuelve SOLO el JSON, sin texto adicional
      `;
      
      const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        let serverText = '';
        try { serverText = await response.text(); } catch {}
        throw new Error(`API request failed: ${response.status} ${response.statusText}${serverText ? ' - ' + serverText : ''}`);
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      
      // Debug: Mostrar la respuesta completa de Gemini
      console.log('=== RESPUESTA COMPLETA DE GEMINI (PDF) ===');
      console.log('Longitud de la respuesta:', text.length);
      console.log('Texto enviado a Gemini (posible truncado):', inputText.slice(0, 500));
      console.log('Respuesta completa de Gemini:', text);
      console.log('Primeros 500 caracteres:', text.slice(0, 500));
      console.log('Últimos 500 caracteres:', text.slice(-500));
      console.log('==========================================');
      
      // Extraer JSON de la respuesta con manejo mejorado
      let jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No se encontró JSON en la respuesta de Gemini');
        throw new Error('No se pudo extraer JSON de la respuesta de Gemini');
      }
      
      let jsonString = jsonMatch[0];
      
      // Verificar si el JSON está incompleto y completarlo
      if (!jsonString.includes('"unitName"')) {
        jsonString += ', "unitName": null';
      }
      if (!jsonString.includes('"serviceType"')) {
        jsonString += ', "serviceType": null';
      }
      if (!jsonString.includes('"scheduledDate"')) {
        jsonString += ', "scheduledDate": null';
      }
      if (!jsonString.includes('"workOrder"')) {
        jsonString += ', "workOrder": null';
      }
      
      // Asegurar que el JSON esté cerrado
      if (!jsonString.endsWith('}')) {
        jsonString += '}';
      }
      
      console.log('JSON procesado:', jsonString);
      
      const extractedData = JSON.parse(jsonString);
      console.log('Datos extraídos del PDF:', extractedData);
      
      return {
        workOrder: extractedData.workOrder || '',
        scheduledDate: extractedData.scheduledDate || '',
        serviceType: extractedData.serviceType || '',
        unitName: extractedData.unitName || ''
      };
      
    } catch (error) {
      console.error('Error en extracción de PDF:', error);
      throw new Error('Error al procesar el PDF: ' + error);
    }
  }

  public static validateUnitName(unitName: string, existingUnits: Array<{id: string, name: string}>): UnitValidationResult {
    const normalizedTarget = this.normalizeUnitString(unitName);

    // Coincidencia exacta removiendo todos los espacios (nombre o codeName si existe)
    const exactMatch = existingUnits.find(unit => {
      const nameNormalized = this.normalizeUnitString(unit.name);
      const codeNameNormalized = this.normalizeUnitString((unit as any).codeName || '');
      return nameNormalized === normalizedTarget || (!!codeNameNormalized && codeNameNormalized === normalizedTarget);
    });

    if (exactMatch) {
      return {
        isValid: true,
        unitId: exactMatch.id,
        unitName: exactMatch.name
      };
    }

    // Sugerencias por coincidencias parciales también sin espacios
    const partialMatches = existingUnits.filter(unit => {
      const nameNormalized = this.normalizeUnitString(unit.name);
      const codeNameNormalized = this.normalizeUnitString((unit as any).codeName || '');
      return (
        nameNormalized.includes(normalizedTarget) ||
        normalizedTarget.includes(nameNormalized) ||
        (!!codeNameNormalized && (codeNameNormalized.includes(normalizedTarget) || normalizedTarget.includes(codeNameNormalized)))
      );
    });

    return {
      isValid: false,
      unitName: unitName,
      error: `La unidad "${unitName}" no existe. ${partialMatches.length > 0 ? `Unidades similares: ${partialMatches.map(u => u.name).join(', ')}` : 'Debe crear esta unidad primero.'}`
    };
  }

  // Método alternativo para cuando PDF.js falla
  public static async extractServiceDataFromFileName(fileName: string): Promise<ExtractedServiceData> {
    try {
      // Enviar a Google Gemini para extraer datos del nombre del archivo
      const prompt = `
        Analiza el siguiente nombre de archivo PDF de orden de trabajo de limpieza y extrae los siguientes datos en formato JSON:

        Nombre del archivo: ${fileName}

        Extrae y devuelve únicamente un objeto JSON con la siguiente estructura:
        {
          "workOrder": "número de orden de trabajo",
          "scheduledDate": "fecha de programación en formato YYYY-MM-DD",
          "serviceType": "tipo de servicio (ej: limpieza regular, limpieza profunda, etc.)",
          "unitName": "nombre de la unidad/propiedad"
        }

        Reglas importantes:
        - Si no encuentras algún campo, usa null para ese valor
        - La fecha debe estar en formato YYYY-MM-DD
        - El workOrder debe ser el número exacto de la orden
        - El unitName debe ser el nombre exacto de la unidad/propiedad
        - El serviceType debe ser descriptivo del tipo de servicio
        - NO uses palabras genéricas del nombre del archivo como "Work Order", "Track", "Software", "PDF", etc.
        - Busca específicamente direcciones (ej: "618 East Ashley Ave"), nombres de propiedades (ej: "Jangada Breeze"), o códigos de unidad
        - Si el nombre del archivo no contiene información específica de la unidad, usa null para unitName
        - Devuelve SOLO el JSON, sin texto adicional
      `;
      
      const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 8192,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      
      // Debug: Mostrar la respuesta completa de Gemini
      console.log('=== RESPUESTA COMPLETA DE GEMINI (NOMBRE ARCHIVO) ===');
      console.log('Longitud de la respuesta:', text.length);
      console.log('Nombre del archivo:', fileName);
      console.log('Respuesta completa de Gemini:', text);
      console.log('Primeros 500 caracteres:', text.slice(0, 500));
      console.log('Últimos 500 caracteres:', text.slice(-500));
      console.log('==================================================');
      
      // Extraer JSON de la respuesta con manejo mejorado
      let jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No se encontró JSON en la respuesta de Gemini');
        throw new Error('No se pudo extraer JSON de la respuesta de Gemini');
      }
      
      let jsonString = jsonMatch[0];
      
      // Verificar si el JSON está incompleto y completarlo
      if (!jsonString.includes('"unitName"')) {
        jsonString += ', "unitName": null';
      }
      if (!jsonString.includes('"serviceType"')) {
        jsonString += ', "serviceType": null';
      }
      if (!jsonString.includes('"scheduledDate"')) {
        jsonString += ', "scheduledDate": null';
      }
      if (!jsonString.includes('"workOrder"')) {
        jsonString += ', "workOrder": null';
      }
      
      // Asegurar que el JSON esté cerrado
      if (!jsonString.endsWith('}')) {
        jsonString += '}';
      }
      
      console.log('JSON procesado:', jsonString);
      
      const extractedData = JSON.parse(jsonString);
      console.log('Datos extraídos del nombre del archivo:', extractedData);
      
      return {
        workOrder: extractedData.workOrder || '',
        scheduledDate: extractedData.scheduledDate || '',
        serviceType: extractedData.serviceType || '',
        unitName: extractedData.unitName || ''
      };
      
    } catch (error) {
      console.error('Error en extracción de datos del nombre de archivo:', error);
      throw new Error('Error al procesar el nombre del archivo: ' + error);
    }
  }

  // Método de respaldo cuando Gemini falla
  private static async extractMultipleServicesFromPDFFallback(file: File): Promise<ExtractedServiceData[]> {
    console.log('🔄 Usando método de respaldo para extraer datos del PDF...');
    
    try {
      // Extraer texto del PDF
      const rawText = await this.extractTextFromPDF(file);
      console.log('✅ Texto extraído (fallback) - primeros 1000 chars:\n', rawText.slice(0, 1000));
      
      // Método simple: buscar patrones comunes en el texto
      const lines = rawText.split('\n').filter(line => line.trim().length > 0);
      const services: ExtractedServiceData[] = [];
      
      // Buscar líneas que contengan información de servicios
      for (const line of lines) {
        // Buscar patrones comunes
        const workOrderMatch = line.match(/(?:work\s*order|orden\s*de\s*trabajo|wo)[\s:]*(\d+)/i);
        const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})/);
        const unitMatch = line.match(/(?:unit|unidad|property|propiedad)[\s:]*([^,\n]+)/i);
        const serviceMatch = line.match(/(?:service|servicio|type|tipo)[\s:]*([^,\n]+)/i);
        
        if (workOrderMatch || dateMatch || unitMatch || serviceMatch) {
          services.push({
            workOrder: workOrderMatch?.[1] || '',
            scheduledDate: dateMatch?.[1] || '',
            serviceType: serviceMatch?.[1]?.trim() || 'Limpieza',
            unitName: unitMatch?.[1]?.trim() || ''
          });
        }
      }
      
      // Si no encontramos nada con el método simple, crear un servicio básico
      if (services.length === 0) {
        console.log('No se encontraron datos específicos, creando servicio básico...');
        services.push({
          workOrder: `WO-${Date.now()}`,
          scheduledDate: new Date().toISOString().split('T')[0],
          serviceType: 'Limpieza',
          unitName: 'Unidad no especificada'
        });
      }
      
      console.log('✅ Servicios extraídos con método de respaldo:', services);
      return services;
      
    } catch (error) {
      console.error('Error en método de respaldo:', error);
      // Último recurso: crear un servicio básico
      return [{
        workOrder: `WO-${Date.now()}`,
        scheduledDate: new Date().toISOString().split('T')[0],
        serviceType: 'Limpieza',
        unitName: 'Unidad no especificada'
      }];
    }
  }
}
