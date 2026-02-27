import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  backHref?: string;
}

export function PageHeader({ title, backHref = '/' }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Link href={backHref} className="text-slate-400 hover:text-white">
        ← 戻る
      </Link>
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
}
