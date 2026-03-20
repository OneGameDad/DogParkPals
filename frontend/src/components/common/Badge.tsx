interface BadgeProps {
    text: string;
    variant?: 'blue' | 'gray' | 'green' | 'red';
    className?: string;
}

const variants = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    red: 'bg-red-50 text-red-700 border-red-100',
};

export default function Badge({ text, variant = 'blue', className = '' }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
        >
            {text}
        </span>
    );
}
