export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: AlertPriority;
  location: string;
  source: string;
  publishedAt: string;
}
