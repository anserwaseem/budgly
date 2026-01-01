import { useBudgeter } from '@/hooks/useBudgeter';
import { Header } from '@/components/Header';
import { StatsBar } from '@/components/StatsBar';
import { TransactionInput } from '@/components/TransactionInput';
import { TransactionList } from '@/components/TransactionList';

const Index = () => {
  const {
    paymentModes,
    theme,
    stats,
    groupedTransactions,
    toggleTheme,
    addTransaction,
    deleteTransaction,
    updateNecessity,
  } = useBudgeter();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-8">
        <Header theme={theme} onToggleTheme={toggleTheme} />

        {/* Stats Section */}
        <section className="py-6 border-b border-border">
          <StatsBar stats={stats} />
        </section>

        {/* Input Section */}
        <section className="py-6 border-b border-border">
          <TransactionInput 
            paymentModes={paymentModes} 
            onAdd={addTransaction} 
          />
        </section>

        {/* Transactions List */}
        <section className="py-6">
          <TransactionList
            groupedTransactions={groupedTransactions}
            onDelete={deleteTransaction}
            onUpdateNecessity={updateNecessity}
          />
        </section>
      </div>
    </div>
  );
};

export default Index;
