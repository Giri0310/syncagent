'use client';

import { useState } from 'react';
import { Article } from '@/lib/types';

interface ArticlesViewerProps {
  articles: Article[];
  onDelete?: (id: string) => void;
}

export default function ArticlesViewer({ articles, onDelete }: ArticlesViewerProps) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    if (!confirm('Are you sure you want to delete this article?')) return;
    setDeleting(id);
    try {
      await onDelete(id);
    } finally {
      setDeleting(null);
    }
    if (selectedArticle?.id === id) {
      setSelectedArticle(null);
    }
  };

  if (selectedArticle) {
    return (
      <ArticleDetail
        article={selectedArticle}
        onBack={() => setSelectedArticle(null)}
        onDelete={onDelete ? () => handleDelete(selectedArticle.id) : undefined}
        deleting={deleting === selectedArticle.id}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Imported Articles</h2>
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2 border"
        />
      </div>
      <div className="divide-y divide-slate-100">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500">No articles found.</div>
        )}
        {filtered.map((article) => (
          <div
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-900 truncate">{article.title}</h3>
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{article.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {article.author && (
                    <span className="text-xs text-slate-500">by {article.author}</span>
                  )}
                  {article.date && (
                    <span className="text-xs text-slate-500">
                      {new Date(article.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {article.images.length > 0 && (
                  <img
                    src={article.images[0].localPath || article.images[0].url}
                    alt={article.title}
                    className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                  />
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(article.id);
                    }}
                    disabled={deleting === article.id}
                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    {deleting === article.id ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArticleDetail({
  article,
  onBack,
  onDelete,
  deleting,
}: {
  article: Article;
  onBack: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-slate-700 font-medium text-sm"
          >
            ← Back
          </button>
          <h2 className="text-lg font-semibold text-slate-900 truncate">{article.title}</h2>
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>
      <div className="p-6 space-y-6">
        {article.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {article.images.map((img, idx) => (
              <div key={idx} className="border border-slate-100 rounded-lg overflow-hidden">
                <img
                  src={img.localPath || img.url}
                  alt={article.title}
                  className="w-full h-32 object-cover"
                />
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          {article.author && <span>Author: {article.author}</span>}
          {article.date && <span>Date: {new Date(article.date).toLocaleString()}</span>}
          <span>Imported: {new Date(article.importedAt).toLocaleString()}</span>
        </div>
        <div className="prose prose-slate max-w-none">
          <MarkdownContent content={article.content} />
        </div>
      </div>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length === 0 || !listType) return;
    const Tag = listType === 'ul' ? 'ul' : 'ol';
    elements.push(
      <Tag key={`list-${elements.length}`} className="list-disc pl-5 mb-4 space-y-1">
        {listItems.map((item, idx) => (
          <li key={idx}>
            <InlineMarkdown text={item.replace(/^[-\d.]+\s+/, '')} />
          </li>
        ))}
      </Tag>
    );
    listItems = [];
    listType = null;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (/^#{1,6}\s+/.test(trimmed)) {
      flushList();
      const level = trimmed.match(/^#+/)?.[0].length || 1;
      const text = trimmed.replace(/^#{1,6}\s+/, '');
      const Tag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
      elements.push(
        <Tag key={idx} className="font-bold text-slate-900 mt-6 mb-2">
          <InlineMarkdown text={text} />
        </Tag>
      );
      return;
    }

    if (/^```/.test(trimmed)) {
      flushList();
      // Simple code block skip; handle multi-line would need state. Ignoring fences for now.
      return;
    }

    if (/^-\s+/.test(trimmed)) {
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(trimmed);
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (listType && listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(trimmed);
      return;
    }

    if (trimmed === '') {
      flushList();
      return;
    }

    flushList();
    elements.push(
      <p key={idx} className="mb-4 whitespace-pre-wrap text-slate-700">
        <InlineMarkdown text={trimmed} />
      </p>
    );
  });

  flushList();
  return <>{elements}</>;
}

function InlineMarkdown({ text }: { text: string }) {
  // Simple regex-based parser for inline images, links, bold, italic, inline code
  const parts: React.ReactNode[] = [];
  const regex = /(!?\[([^\]]*)\]\(([^)]+)\)|\*\*(.+?)\*\*|_(.+?)_|`([^`]+)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={lastIndex}>{text.slice(lastIndex, match.index)}</span>);
    }

    if (match[0].startsWith('![') && match[3]) {
      parts.push(
        <img
          key={match.index}
          src={match[3]}
          alt={match[2]}
          className="max-w-full h-auto rounded-lg my-4 border border-slate-200"
        />
      );
    } else if (match[0].startsWith('[') && match[3]) {
      parts.push(
        <a
          key={match.index}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:underline"
        >
          {match[2]}
        </a>
      );
    } else if (match[0].startsWith('**') && match[4]) {
      parts.push(
        <strong key={match.index} className="font-semibold text-slate-900">
          {match[4]}
        </strong>
      );
    } else if (match[0].startsWith('_') && match[5]) {
      parts.push(<em key={match.index}>{match[5]}</em>);
    } else if (match[0].startsWith('`') && match[6]) {
      parts.push(
        <code key={match.index} className="bg-slate-100 px-1 py-0.5 rounded text-sm font-mono">
          {match[6]}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
  }

  return <>{parts.length > 0 ? parts : text}</>;
}