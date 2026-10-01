import React from "react";

export const Card = ({ className, children, title }: { className?: string; children: React.ReactNode; title?: string }) => {
  return (
    <div className={`bg-rentora-card rounded-lg border border-rentora-border p-6 ${className}`}>
      {title && <h3 className="font-medium text-rentora-dark text-sm mb-4">{title}</h3>}
      {children}
    </div>
  );
};

export const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  className,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon?: JSX.Element;
  className?: string;
}) => {
  return (
    <div className={`bg-rentora-card rounded-lg border border-rentora-border p-6 ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-rentora-muted text-sm">{title}</span>
        <icon />
      </div>
      <div className="text-2xl font-bold text-rentora-accent">{value}</div>
      <p className="text-rentora-muted text-sm">{subtitle}</p>
    </div>
  );
};

export const SmallStatCard = ({
  title,
  value,
  className,
}: {
  title: string;
  value: string | number;
  className?: string;
}) => {
  return (
    <div className={`p-4 rounded-lg border border-rentora-border hover:bg-rentora-light transition-colors ${className}`}>
      <p className="text-rentora-muted text-xs uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-bold text-rentora-dark">{value}</p>
    </div>
  );
};

export const Table = ({ columns, data, title }: { columns: string[]; data: any[]; title?: string }) => {
  return (
    <Card title={title}>
      <div className="overflow-x-auto">
        <table className="w-full rounded-lg border-rentora-border">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} className="text-left text-rentora-muted text-xs font-medium uppercase tracking-wider px-4 py-3">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b hover:bg-rentora-light">
                {columns.map((col) => (
                  <td key={col} className="text-rentora-dark text-sm px-4 py-3">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export const EmptyState = ({ icon, title, description }: { icon: JSX.Element; title: string; description: string }) => {
  return (
    <div className="text-center py-12">
      <icon className="w-16 h-16 mx-auto text-rentora-muted mb-4" />
      <h3 className="text-rentora-dark font-medium mb-2">{title}</h3>
      <p className="text-rentora-muted">{description}</p>
    </div>
  );
};

export const Skeleton = ({ className, height }: { className?: string; height?: string }) => {
  return (
    <div className={`animate-shine rounded bg-rentora-border ${className}`} style={{ height }} />
  );
};