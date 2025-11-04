import type { Worker, Service, ReportData } from '../types';

const API_KEY = "AIzaSyD54l3Z5QAa8SIyRuGDlaLXwW57hFKpTMs";
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export const generateReport = async (
    workers: Worker[], 
    services: Service[],
    startDate: string,
    endDate: string
): Promise<ReportData | null> => {
    if (!API_KEY) {
        throw new Error("API key is not configured. Cannot generate report.");
    }

    const relevantServices = services.filter(s => s.start_date >= startDate && s.start_date <= endDate);

    if (relevantServices.length === 0) {
        return {};
    }

    const workerInfo = workers.map(w => ({
        id: w.id,
        name: w.name,
        hourly_rate: w.hourly_rate
    }));

    const prompt = `
        You are a reporting analyst for a cleaning company. Based on the following service data and worker information for the period from ${startDate} to ${endDate}, calculate the total hours worked, total payment owed, and the number of services for each worker.

        Rules:
        1.  The duration of a service for a worker is the difference between its end_time and start_time.
        2.  A worker's pay for a service is their hourly rate multiplied by the service duration in hours.
        3.  Sum these values for each worker across all services they participated in.

        Worker Information:
        ${JSON.stringify(workerInfo)}

        Services Data:
        ${JSON.stringify(relevantServices)}

        Return the result as a JSON object. The keys should be the worker names. Each value should be an object containing 'totalHours', 'totalPay', and 'servicesCount'.
    `;
    
    try {
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
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const jsonText = data.candidates[0].content.parts[0].text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        // Fallback to manual calculation if API fails
        return calculateReportManually(workers, relevantServices);
    }
};

const calculateReportManually = (workers: Worker[], services: Service[]): ReportData => {
    const report: ReportData = {};

    workers.forEach(worker => {
        report[worker.name] = {
            totalHours: 0,
            totalPay: 0,
            servicesCount: 0
        };
    });

    services.forEach(service => {
        const [startH, startM] = service.start_time.split(':').map(Number);
        const [endH, endM] = service.end_time.split(':').map(Number);
        const duration = (endH - startH) + (endM - startM) / 60;

        if (duration > 0) {
            service.worker_ids.forEach(workerId => {
                const worker = workers.find(w => w.id === workerId);
                if (worker && report[worker.name]) {
                    report[worker.name].totalHours += duration;
                    report[worker.name].totalPay += duration * worker.hourly_rate;
                    report[worker.name].servicesCount += 1;
                }
            });
        }
    });

    return report;
};
