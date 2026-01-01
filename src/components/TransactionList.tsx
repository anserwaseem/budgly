import { Transaction, NecessityType } from '@/lib/types';
import { TransactionCard } from './TransactionCard';
import { getRelativeDate } from '@/lib/parser';
import { Receipt, Sparkles, TrendingUp, Zap, ChevronDown } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TransactionListProps {
  groupedTransactions: [string, { transactions: Transaction[], dayTotal: number }][];
  currencySymbol: string;
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onUpdateNecessity: (id: string, necessity: NecessityType) => void;
  onDuplicate?: (transaction: Transaction) => void;
}

// Animated empty state tips
const emptyStateTips = [
  { icon: Zap, text: "Type 'Coffee CC 150' to add an expense" },
  { icon: Sparkles, text: "Use voice input for hands-free entry" },
  { icon: TrendingUp, text: "Categorize as Need or Want to track habits" },
];

type GroupMode = 'day' | 'month' | 'year';

export function TransactionList({ 
  groupedTransactions, 
  currencySymbol,
  onDelete, 
  onEdit,
  onUpdateNecessity,
  onDuplicate,
}: TransactionListProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [groupMode, setGroupMode] = useState<GroupMode>('day');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Rotate tips every 4 seconds
  useEffect(() => {
    if (groupedTransactions.length > 0) return;
    
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % emptyStateTips.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [groupedTransactions.length]);

  // Regroup transactions based on mode
  const regroupedTransactions = useMemo(() => {
    if (groupMode === 'day') {
      // Default day grouping - expand most recent by default
      if (expandedGroups.size === 0 && groupedTransactions.length > 0) {
        setExpandedGroups(new Set([groupedTransactions[0][0]]));
      }
      return groupedTransactions;
    }

    // Flatten all transactions
    const allTransactions = groupedTransactions.flatMap(([, { transactions }]) => transactions);
    
    // Group by month or year
    const grouped: Record<string, { transactions: Transaction[], dayTotal: number }> = {};
    
    allTransactions.forEach(t => {
      const date = new Date(t.date);
      const key = groupMode === 'month' 
        ? format(date, 'yyyy-MM') 
        : format(date, 'yyyy');
      
      if (!grouped[key]) {
        grouped[key] = { transactions: [], dayTotal: 0 };
      }
      grouped[key].transactions.push(t);
      if (t.type === 'expense') {
        grouped[key].dayTotal += t.amount;
      }
    });

    const result = Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
    
    // Expand most recent by default when switching modes
    if (result.length > 0 && !expandedGroups.has(result[0][0])) {
      setExpandedGroups(new Set([result[0][0]]));
    }
    
    return result;
  }, [groupedTransactions, groupMode]);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getGroupLabel = (key: string) => {
    if (groupMode === 'day') {
      return getRelativeDate(key);
    }
    if (groupMode === 'month') {
      const [year, month] = key.split('-');
      return format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy');
    }
    return key; // year
  };

  if (groupedTransactions.length === 0) {
    const currentTip = emptyStateTips[tipIndex];
    const TipIcon = currentTip.icon;
    
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 animate-pulse-soft">
          <Receipt className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No transactions yet</h3>
        <p className="text-sm text-muted-foreground max-w-[280px] mb-8">
          Start tracking your expenses and income to see insights here
        </p>
        
        {/* Rotating tip */}
        <div className="flex items-center gap-3 px-4 py-3 bg-muted rounded-xl animate-fade-in" key={tipIndex}>
          <TipIcon className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm text-foreground">{currentTip.text}</p>
        </div>
        
        {/* Tip indicators */}
        <div className="flex gap-1.5 mt-4">
          {emptyStateTips.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === tipIndex ? 'bg-primary w-4' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Group Mode Toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {(['day', 'month', 'year'] as GroupMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => {
              setGroupMode(mode);
              setExpandedGroups(new Set());
            }}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-all capitalize",
              groupMode === mode 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Transaction Groups */}
      <div className="space-y-2">
        {regroupedTransactions.map(([key, { transactions, dayTotal }], groupIdx) => {
          const isExpanded = expandedGroups.has(key);
          
          return (
            <Collapsible
              key={key}
              open={isExpanded}
              onOpenChange={() => toggleGroup(key)}
              className="animate-slide-up"
              style={{ animationDelay: `${groupIdx * 50}ms` }}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between px-3 py-2.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors group">
                  <div className="flex items-center gap-2">
                    <ChevronDown className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180"
                    )} />
                    <span className="text-sm font-medium text-foreground">
                      {getGroupLabel(key)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({transactions.length})
                    </span>
                  </div>
                  {dayTotal > 0 && (
                    <span className="text-sm font-mono font-medium text-expense">
                      −{currencySymbol}{dayTotal.toLocaleString('en-PK')}
                    </span>
                  )}
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="space-y-1 pt-2">
                  {transactions.map((transaction, idx) => (
                    <div
                      key={transaction.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <TransactionCard
                        transaction={transaction}
                        currencySymbol={currencySymbol}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onUpdateNecessity={onUpdateNecessity}
                        onDuplicate={onDuplicate}
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
