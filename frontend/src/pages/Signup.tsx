import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

export default function Signup() {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [secondaryEmail, setSecondaryEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from || '/dashboard';
    const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
    const confirmationResultRef = useRef<ConfirmationResult | null>(null);

    useEffect(() => {
        let isMounted = true;

        try {
            const auth = getFirebaseAuth();
            if (isMounted && !recaptchaVerifierRef.current) {
                recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible',
                });
                recaptchaVerifierRef.current.render().catch(() => undefined);
            }
        } catch (error) {
            console.error('Firebase setup failed:', error);
        }

        return () => {
            isMounted = false;
            recaptchaVerifierRef.current?.clear();
            recaptchaVerifierRef.current = null;
        };
    }, []);

    const sendOtp = async () => {
        if (!name.trim() || !phoneNumber.trim() || !secondaryEmail.trim() || !password.trim()) {
            toast.error('Name, phone number, secondary email, and password are required.');
            return;
        }

        if (!phoneNumber.trim().startsWith('+')) {
            toast.error('Enter the phone number with country code, for example +919876543210.');
            return;
        }

        if (!recaptchaVerifierRef.current) {
            toast.error('Phone verification is not ready yet. Please wait a moment and try again.');
            return;
        }

        try {
            setIsSendingCode(true);
            const auth = getFirebaseAuth();
            const confirmation = await signInWithPhoneNumber(auth, phoneNumber.trim(), recaptchaVerifierRef.current);
            confirmationResultRef.current = confirmation;
            setOtpSent(true);
            toast.success('OTP sent to your phone.');
        } catch (error: any) {
            console.error('OTP send failed:', error);
            toast.error(error?.message || 'Could not send OTP. Please try again.');
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otpSent) {
            await sendOtp();
            return;
        }

        if (!verificationCode.trim()) {
            toast.error('Enter the OTP sent to your phone.');
            return;
        }

        if (!confirmationResultRef.current) {
            toast.error('OTP verification session expired. Please request a new code.');
            setOtpSent(false);
            return;
        }

        try {
            setIsSubmitting(true);
            await confirmationResultRef.current.confirm(verificationCode.trim());
            await signup({
                name,
                phoneNumber,
                secondaryEmail,
                password,
                companyName,
            });
            navigate(from, { replace: true });
        } catch (error: any) {
            console.error('Signup flow failed:', error);
            toast.error(error?.message || 'Failed to verify OTP or create account.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Create account</CardTitle>
                    <CardDescription>
                        Sign up with your phone number, verify it with OTP, and keep a secondary email for account contact.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Phone number</Label>
                            <Input
                                id="phoneNumber"
                                type="tel"
                                placeholder="+91 9876543210"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="secondaryEmail">Secondary email</Label>
                            <Input
                                id="secondaryEmail"
                                type="email"
                                placeholder="backup@example.com"
                                value={secondaryEmail}
                                onChange={(e) => setSecondaryEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company name</Label>
                            <Input
                                id="companyName"
                                type="text"
                                placeholder="Your company"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {otpSent && (
                            <div className="space-y-2">
                                <Label htmlFor="otp">OTP</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Enter the 6-digit code"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={isSubmitting || isSendingCode}>
                            {isSubmitting
                                ? 'Verifying...'
                                : isSendingCode
                                  ? 'Sending OTP...'
                                  : otpSent
                                    ? 'Verify OTP & Create account'
                                    : 'Send OTP'}
                        </Button>
                        <div id="recaptcha-container" />
                        <div className="mt-4 text-center">
                            <Link to="/login" className="text-sm text-muted-foreground hover:underline">
                                Already have an account? Login
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
