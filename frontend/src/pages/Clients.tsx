import { useState, useEffect } from 'react';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';
import { COUNTRY_OPTIONS, TAX_ID_NAME_BY_COUNTRY, TAX_ID_NAME_OPTIONS } from '@/data/taxIdCatalog';
import type { Client } from '@/types/client';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [clientStats, setClientStats] = useState<{ totalQuotations: number; totalRevenue: number; lastQuotationDate: string | null } | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');

  // Form state
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [taxIdName, setTaxIdName] = useState('');
  const [taxIdValue, setTaxIdValue] = useState('');

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients');
      setClients(data);
    } catch (error: any) {
      toast.error('Failed to fetch clients');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCompanyName('');
    setEmail('');
    setContactNumber('');
    setAddress('');
    setCountry('');
    setTaxIdName('');
    setTaxIdValue('');
    setEditingId(null);
  };

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingId(client._id);
      setName(client.name);
      setCompanyName(client.companyName);
      setEmail(client.email);
      setContactNumber(client.contactNumber);
      setAddress(client.address || '');
      setCountry(client.country || '');
      setTaxIdName(client.taxIdName || (client.country ? TAX_ID_NAME_BY_COUNTRY[client.country] || '' : ''));
      setTaxIdValue(client.taxIdValue || client.gstin || '');
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        name,
        companyName,
        email,
        contactNumber,
        address,
        country,
        taxIdName,
        taxIdValue,
        gstin: taxIdValue,
      };

      if (editingId) {
        await api.put(`/clients/${editingId}`, payload);
        toast.success('Client updated successfully');
      } else {
        await api.post('/clients', payload);
        toast.success('Client added successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchClients();
    } catch (error: any) {
      toast.error('Failed to save client');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const target = clients.find((client) => client._id === id) || null;
    setDeleteTarget(target);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.delete(`/clients/${deleteTarget._id}`);
      toast.success('Client deleted');
      fetchClients();
    } catch (error) {
      toast.error('Failed to delete client');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const openClientProfile = async (client: Client) => {
    setViewClient(client);
    setIsStatsLoading(true);
    try {
      const { data } = await api.get(`/clients/${client._id}/stats`);
      setClientStats(data);
    } catch {
      setClientStats(null);
      toast.error('Failed to load client history');
    } finally {
      setIsStatsLoading(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      client.name.toLowerCase().includes(query) ||
      client.companyName.toLowerCase().includes(query) ||
      (client.email || '').toLowerCase().includes(query);
    const matchesCountry = countryFilter === 'all' || (client.country || '') === countryFilter;
    return matchesSearch && matchesCountry;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-14 md:top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Clients</h1>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage your client relationships.
              </p>
            </div>
            {user?.role === 'SuperAdmin' && (
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button variant="accent" onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingId ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Number</Label>
                      <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Select
                        value={country || 'none'}
                        onValueChange={(value) => {
                          const nextCountry = value === 'none' ? '' : value;
                          setCountry(nextCountry);
                          if (nextCountry && TAX_ID_NAME_BY_COUNTRY[nextCountry]) {
                            setTaxIdName(TAX_ID_NAME_BY_COUNTRY[nextCountry]);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {COUNTRY_OPTIONS.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Primary Tax ID Name</Label>
                      <Select value={taxIdName || 'none'} onValueChange={(value) => setTaxIdName(value === 'none' ? '' : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tax ID name" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {TAX_ID_NAME_OPTIONS.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{taxIdName || 'Tax ID Number'}</Label>
                      <Input value={taxIdValue} onChange={(e) => setTaxIdValue(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSaving}>
                      {isSaving ? 'Saving...' : (editingId ? 'Update Client' : 'Create Client')}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Input
              placeholder="Search by name, company, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={countryFilter}
            onValueChange={(value) => setCountryFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Filter by country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {COUNTRY_OPTIONS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-muted/50 sticky top-0 z-10 backdrop-blur">
                  <tr>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Company</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contact</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Address</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Country</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Primary Tax ID</th>
                    {user?.role === 'SuperAdmin' && (
                      <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredClients.map((client) => (
                    <tr
                      key={client._id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => openClientProfile(client)}
                    >
                      <td className="py-3 px-4 font-medium text-foreground">{client.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{client.companyName}</td>
                      <td className="py-3 px-4 text-muted-foreground">{client.email || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{client.contactNumber || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{client.address || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{client.country || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {client.taxIdName && (client.taxIdValue || client.gstin)
                          ? `${client.taxIdName}: ${client.taxIdValue || client.gstin}`
                          : (client.taxIdValue || client.gstin || '-')}
                      </td>
                      {user?.role === 'SuperAdmin' && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => handleOpenDialog(client)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(client._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {!isLoading && filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No clients found</h3>
            <p className="text-muted-foreground mt-1">
              Try adjusting your filters or add a new client.
            </p>
          </div>
        )}

        <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete client?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove the client record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={Boolean(viewClient)} onOpenChange={(open) => !open && setViewClient(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Client Profile</DialogTitle>
            </DialogHeader>
            {viewClient && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="text-lg font-semibold text-foreground">{viewClient.name}</p>
                  <p className="text-sm text-muted-foreground">{viewClient.companyName}</p>
                  <p className="text-sm text-muted-foreground">{viewClient.email || '-'}</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">Total Quotations</p>
                    <p className="text-lg font-semibold">
                      {isStatsLoading ? '...' : clientStats?.totalQuotations ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                    <p className="text-lg font-semibold">
                      {isStatsLoading ? '...' : `₹${(clientStats?.totalRevenue ?? 0).toLocaleString('en-IN')}`}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">Last Quote</p>
                    <p className="text-lg font-semibold">
                      {isStatsLoading
                        ? '...'
                        : clientStats?.lastQuotationDate
                          ? new Date(clientStats.lastQuotationDate).toLocaleDateString('en-IN')
                          : '-'}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Address: {viewClient.address || '-'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Country: {viewClient.country || '-'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Tax ID: {viewClient.taxIdName ? `${viewClient.taxIdName}: ` : ''}{viewClient.taxIdValue || viewClient.gstin || '-'}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
