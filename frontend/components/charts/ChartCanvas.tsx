"use client";
import { useEffect, useRef } from "react";


export type ChartConfig = {
    type: any; // 'bar' | 'pie' | 'line' | ...
    data: any;
    options?: any;
};


export default function ChartCanvas({ config }: { config: ChartConfig }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const chartRef = useRef<any>(null);


    useEffect(() => {
        let mounted = true;
        (async () => {
            const { default: Chart } = await import("chart.js/auto");
            if (!mounted || !canvasRef.current) return;
            if (chartRef.current) chartRef.current.destroy();
            chartRef.current = new Chart(canvasRef.current, config as any);
        })();
        return () => {
            mounted = false;
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, [JSON.stringify(config)]);


    return <canvas ref={canvasRef} />;
}