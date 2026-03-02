import { JobType } from '@/lib/types';
import Image from 'next/image';

interface JobIconProps {
  job: JobType;
  size?: number;
  className?: string;
}

export function JobIcon({ job, size = 32, className = '' }: JobIconProps) {
  return (
    <Image
      src={`/icons/jobs/${job}.svg`}
      alt={job}
      width={size}
      height={size}
      className={className}
    />
  );
}
