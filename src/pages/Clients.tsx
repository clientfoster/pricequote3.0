import { Users, Mail, Phone, Building } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { mockQuotations } from '@/data/mockQuotations';

// Extract unique clients from quotations
const clients = mockQuotations.reduce((acc, quotation) => {
  const key = quotation.header.companyName;
  if (!acc.has(key)) {
    acc.set(key, {
      clientName: quotation.header.clientName,
      companyName: quotation.header.companyName,
      contactNumber: quotation.header.contactNumber,
      email: quotation.header.email,
      totalQuotations: 1,
      totalValue: quotation.totals.totalPayable,
    });
  } else {
    const existing = acc.get(key)!;
    existing.totalQuotations += 1;
    existing.totalValue += quotation.totals.totalPayable;
  }
  return acc;
}, new Map<string, any>());

const clientList = Array.from(clients.values());

export default function Clients() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Clients</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage your client relationships.
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientList.map((client, index) => (
            <Card
              key={client.companyName}
              className="hover:shadow-md transition-shadow cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{client.clientName}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <Building className="w-3.5 h-3.5" />
                      <span className="truncate">{client.companyName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{client.contactNumber}</span>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Quotations</p>
                    <p className="font-semibold">{client.totalQuotations}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Value</p>
                    <p className="font-semibold text-accent">{formatCurrency(client.totalValue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {clientList.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No clients yet</h3>
            <p className="text-muted-foreground mt-1">
              Create your first quotation to add a client.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
