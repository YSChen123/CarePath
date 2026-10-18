import { ArrowRight, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </header>
  );
}
export function TextLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link className="text-link" to={to}>
      {children}
      <ArrowRight size={17} />
    </Link>
  );
}
export function SearchField({
  value,
  onChange,
  label = "检索当前视图",
  placeholder = "输入关键词",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}) {
  return (
    <div className="search-field">
      <Search size={17} aria-hidden="true" />
      <input
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button aria-label="清除搜索" onClick={() => onChange("")}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}
export function EmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <div className="empty-state">
      <h3>没有找到匹配内容</h3>
      <p>试试其他关键词，或清除检索条件。</p>
      {onReset && (
        <button className="text-button" onClick={onReset}>
          清除检索
        </button>
      )}
    </div>
  );
}
export function Tabs({
  value,
  onChange,
  items,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  items: { id: string; label: string }[];
  label: string;
}) {
  return (
    <div className="tabs" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          className={value === item.id ? "active" : ""}
          aria-pressed={value === item.id}
          key={item.id}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
