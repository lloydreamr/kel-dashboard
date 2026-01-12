'use client';

/**
 * SourceFileLink Component
 *
 * Displays a link to the original source file.
 * Shows the file path with an external link icon.
 */

import { ExternalLink, FileText } from 'lucide-react';

import { cn } from '@/lib/utils';

export type SourceFileLinkProps = {
  /** Path or URL to the source file */
  sourceFile: string | null | undefined;
  /** Additional CSS classes */
  className?: string;
};

export function SourceFileLink({ sourceFile, className }: SourceFileLinkProps) {
  if (!sourceFile) {
    return null;
  }

  // Check if it's a URL or a file path
  const isUrl = sourceFile.startsWith('http://') || sourceFile.startsWith('https://');

  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <FileText className="h-4 w-4 flex-shrink-0" />
      {isUrl ? (
        <a
          href={sourceFile}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground hover:underline flex items-center gap-1 min-h-[48px] py-2"
          data-testid="source-file-link"
        >
          <span className="truncate max-w-[300px]">{sourceFile}</span>
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
        </a>
      ) : (
        <span className="truncate" data-testid="source-file-path">{sourceFile}</span>
      )}
    </div>
  );
}
