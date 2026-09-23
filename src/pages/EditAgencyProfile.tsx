import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2, Building2, User, MapPin, FileText, Camera } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { agencyApi, type ApiAgency } from '@/services/agencyApi';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { userApi } from '@/services/userApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateUser } from '@/store/slices/authSlice';

// Small label row used above every field: shows a required "*" in orange,
// or a muted "(optional)" hint when the field isn't mandatory — same
// pattern as the Signup flow, so Edit Profile reads consistently with it.
function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-white/80">
      {label}
      {required ? (
        <span className="font-bold text-orange-400">*</span>
      ) : (
        <span className="text-[11px] font-normal text-white/35">(optional)</span>
      )}
    </span>
  );
}

export default function EditAgencyProfile() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s) => s.auth.user);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<ApiAgency['verificationStatus']>('unverified');

  // Lives on the User document, separate from `ownerName` below (which
  // is the agency's own contact-person field on AgencyProfile) — this
  // page never had a field to fix/set the account's own name at all.
  const [name, setName] = useState(authUser?.name || '');
  const [agencyName, setAgencyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  // Signup requires an ID / Address proof document for agencies, but this
  // Edit form never had a field for it — adding it back here. `hasExistingDocument`
  // tracks whether one's already on file so we don't force a re-upload on
  // every edit, only the first time. NOTE: adjust the `a.documentUrl` check
  // below if your ApiAgency type uses a different field name for the
  // uploaded document's URL.
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [hasExistingDocument, setHasExistingDocument] = useState(false);

  useEffect(() => {
    agencyApi
      .getMyProfile()
      .then((a) => {
        setAgencyName(a.agencyName || '');
        setOwnerName(a.ownerName || '');
        setMobile(a.mobile || '');
        setCity(a.city || '');
        setState(a.state || '');
        setGstNumber(a.gstNumber || '');
        setStatus(a.verificationStatus);
        setHasExistingDocument(Boolean((a as any).documentUrl));
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    setDocumentFile(file);
  };

  // Same pattern as Signup.tsx's setFieldError — sets the error text AND
  // scrolls/focuses the exact field that's wrong. The 320ms delay matches
  // the fix applied to Signup.tsx: the error banner takes 250ms to
  // animate its height open, so scrolling before that finishes lands in
  // the wrong spot because the layout is still shifting.
  const setFieldError = (fieldId: string, message: string) => {
    setError(message);
    setTimeout(() => {
      const el = document.getElementById(fieldId);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof (el as HTMLElement).focus === 'function') {
        (el as HTMLElement).focus({ preventScroll: true });
      }
    }, 320);
  };

  // Same required set as the Signup flow's "work" step for agencies
  // (agencyName, ownerName, city, state, gstNumber), plus mobile (phone was
  // required on Signup's "personal" step) and now name (User.name — was
  // previously not editable anywhere on this page). Signup also requires
  // teamSize, yearsInBusiness and specialization, but this edit form has
  // no fields for those, so they're left out here. Returns true if valid.
  const validate = (): boolean => {
    if (!name.trim()) {
      setFieldError('field-name', 'Your full name is required');
      return false;
    }
    if (!agencyName.trim()) {
      setFieldError('field-agencyName', 'Agency name is required');
      return false;
    }
    if (!ownerName.trim()) {
      setFieldError('field-ownerName', 'Owner name is required');
      return false;
    }
    if (!mobile.trim() || mobile.trim().length !== 10) {
      setFieldError('field-mobile', 'A valid 10-digit mobile number is required');
      return false;
    }
    if (!city.trim()) {
      setFieldError('field-city', 'City is required');
      return false;
    }
    if (!state.trim()) {
      setFieldError('field-state', 'State is required');
      return false;
    }
    if (!gstNumber.trim()) {
      setFieldError('field-gstNumber', 'GST number is required');
      return false;
    }
    if (!documentFile && !hasExistingDocument) {
      setFieldError('field-document', 'ID / Address proof is required');
      return false;
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    if (!validate()) return;

    setSaving(true);
    try {
      if (documentFile) {
        await agencyApi.uploadDocument(documentFile);
        setHasExistingDocument(true);
      }

      // Name lives on the User document, not AgencyProfile.
      if (name.trim() !== (authUser?.name || '')) {
        await userApi.updateMe({ name: name.trim() });
        dispatch(updateUser({ name: name.trim() }));
      }

      await agencyApi.updateMyProfile({
        agencyName,
        ownerName,
        mobile,
        city,
        state,
        gstNumber,
        submitForApproval: true,
      });
      const wasUnapproved = status === 'unverified' || status === 'rejected';
      setSaved(true);
      setStatus((s) => (s === 'unverified' || s === 'rejected' ? 'pending' : s));
      if (wasUnapproved) {
        setTimeout(() => navigate('/pending-approval'), 1000);
      } else {
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-white/50">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading your agency profile...</p>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-16">
      <Container className="!max-w-2xl">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          {status === 'unverified' ? 'Register Your Agency' : 'Edit Agency Profile'}
        </h1>
        <p className="mt-1 text-sm text-white/60">
          {status === 'rejected'
            ? 'Update your details and resubmit for review.'
            : 'Saving submits (or resubmits) your details for admin approval.'}
        </p>
        <p className="mt-1 text-xs text-white/40">
          Fields marked <span className="font-semibold text-orange-400">*</span> are required
        </p>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}
        {saved && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 size={16} className="shrink-0" /> Submitted — redirecting to your dashboard.
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
          <label className="block" id="field-document">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-white/80">
              ID / Address proof <span className="font-bold text-orange-400">*</span>
            </span>
            <input ref={documentInputRef} type="file" accept="image/*" onChange={handleDocumentSelect} className="hidden" />
            <button
              type="button"
              onClick={() => documentInputRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-white/15 bg-navy-800/70 px-4 py-3 text-left text-sm text-white/60 hover:border-orange-400/50"
            >
              <Camera size={16} className="shrink-0 text-white/40" />
              {documentFile
                ? documentFile.name
                : hasExistingDocument
                  ? 'Document on file — tap to replace'
                  : 'Tap to upload an image'}
            </button>
          </label>

          <label className="block">
            <FieldLabel label="Your full name" required />
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                id="field-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400"
              />
            </div>
          </label>

          <label className="block">
            <FieldLabel label="Agency name" required />
            <div className="relative">
              <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                id="field-agencyName"
                required
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white focus:border-orange-400"
              />
            </div>
          </label>

          <label className="block">
            <FieldLabel label="Owner name" required />
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                id="field-ownerName"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white focus:border-orange-400"
              />
            </div>
          </label>

          <label className="block">
            <FieldLabel label="Mobile number" required />
            <input
              id="field-mobile"
              type="tel"
              inputMode="numeric"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              maxLength={10}
              className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block" id="field-city">
              <FieldLabel label="City" required />
              <LocationAutocomplete icon={MapPin} mode="api" value={city} onChange={setCity} placeholder="" />
            </label>
            <label className="block">
              <FieldLabel label="State" required />
              <input
                id="field-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white focus:border-orange-400"
              />
            </label>
          </div>

          <label className="block">
            <FieldLabel label="GST number" required />
            <div className="relative">
              <FileText size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                id="field-gstNumber"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white focus:border-orange-400"
              />
            </div>
          </label>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="flex-1 justify-center">
              {saving ? <Loader2 size={18} className="animate-spin" /> : status === 'unverified' ? 'Submit for Approval' : 'Save & Resubmit'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard/agency')}>
              Cancel
            </Button>
          </div>
        </form>
      </Container>
    </div>
  );
}