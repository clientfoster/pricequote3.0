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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';
import { COUNTRY_OPTIONS, TAX_ID_NAME_BY_COUNTRY, TAX_ID_NAME_OPTIONS } from '@/data/taxIdCatalog';

interface Client {
  _id: string;
  name: string;
  companyName: string;
  email: string;
  contactNumber: string;
  address?: string;
  country?: string;
  taxIdName?: string;
  taxIdValue?: string;
  gstin?: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await api.delete(`/clients/${id}`);
        toast.success('Client deleted');
        fetchClients();
      } catch (error) {
        toast.error('Failed to delete client');
      }
    }
  };

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
                  <Button variant="accent" onClick={() => handleOpenDialog()}>
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
                    <Button type="submit" className="w-full">{editingId ? 'Update Client' : 'Create Client'}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Company</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Contact</th>
                    <th className="text-left py-3 px-4 font-medium">Address</th>
                    <th className="text-left py-3 px-4 font-medium">Country</th>
                    <th className="text-left py-3 px-4 font-medium">Primary Tax ID</th>
                    {user?.role === 'SuperAdmin' && (
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients.map((client) => (
                    <tr key={client._id} className="hover:bg-muted/30">
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
                          <div className="flex justify-end gap-2">
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

        {!isLoading && clients.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No clients yet</h3>
            <p className="text-muted-foreground mt-1">
              Add a client or create a quotation to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
