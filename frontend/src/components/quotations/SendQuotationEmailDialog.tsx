import { useEffect, useMemo, useState } from 'react';
import { Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getQuotationPDFBlob } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Quotation } from '@/types/quotation';

interface SendQuotationEmailDialogProps {
  quotation: Quotation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read PDF'));
    reader.readAsDataURL(blob);
  });

export function SendQuotationEmailDialog({ quotation, open, onOpenChange }: SendQuotationEmailDialogProps) {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const normalizedQuotation = useMemo(() => ({
    ...quotation,
    quoteDate: new Date(quotation.quoteDate),
    validUntil: new Date(quotation.validUntil),
  }), [quotation]);

  useEffect(() => {
    if (!open) return;
    setEmail(quotation.email || '');
    setSubject(`Quotation ${quotation.quoteNumber} from ${quotation.issuerCompanyName || 'Quotemaster'}`);
    setMessage(
      `Hi ${quotation.clientName || 'there'},\n\nPlease find your quotation attached as a PDF.\n\nLet me know if you have any questions.\n\nRegards,\n${quotation.issuerCompanyName || 'Quotemaster'}`
    );
  }, [open, quotation]);

  const handleSend = async () => {
    if (!email.trim()) {
      toast.error('Please enter a client email');
      return;
    }
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);
    try {
      const pdfBlob = getQuotationPDFBlob(normalizedQuotation);
      const pdfBase64 = await blobToBase64(pdfBlob);
      const htmlMessage = message.replace(/\n/g, '<br />');

      await api.post(`/quotations/${quotation._id}/send-email`, {
        email,
        subject,
        message: `<div style="font-family:Arial, sans-serif; line-height:1.5;">${htmlMessage}</div>`,
        pdfBase64,
        filename: `${quotation.quoteNumber}.pdf`,
      });

      toast.success('Quotation email sent successfully');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-accent" />
            Send Quotation Email
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Client Email</Label>
            <Input
              id="clientEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailSubject">Email Subject</Label>
            <Input
              id="emailSubject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Quotation subject"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailMessage">Custom Message</Label>
            <Textarea
              id="emailMessage"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button variant="accent" onClick={handleSend} disabled={isSending}>
              {isSending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
