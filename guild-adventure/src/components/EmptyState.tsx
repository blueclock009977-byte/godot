import Link from 'next/link';

interface EmptyStateProps {
  message: string;
  subMessage?: string;
  linkText?: string;
  linkHref?: string;
  className?: string;
}

export function EmptyState({ 
  message, 
  subMessage, 
  linkText, 
  linkHref,
  className = 'py-8',
}: EmptyStateProps) {
  return (
    <div className={`text-center text-slate-500 ${className}`}>
      <p className="text-lg">{message}</p>
      {subMessage && <p className="text-sm mt-2">{subMessage}</p>}
      {linkText && linkHref && (
        <Link href={linkHref} className="text-amber-400 hover:underline block mt-2">
          {linkText}
        </Link>
      )}
    </div>
  );
}
