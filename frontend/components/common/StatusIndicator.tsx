export default function StatusIndicator({ text }: { text: string }) {
    return (
        <div className="status-indicator saved inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold">
            <i className="fas fa-circle text-green-400 mr-2" />
            <span>{text}</span>
        </div>
    );
}