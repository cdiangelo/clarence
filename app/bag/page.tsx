'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useBagStore, type BagSection } from '@/stores/bag';
import { AppShell } from '@/components/layout/AppShell';
import { StandBag } from '@/components/bag/StandBag';
import { SectionDetail } from '@/components/bag/SectionDetail';
import { CLUBS, type ClubModel } from '@/data/clubs';

export default function BagPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { clubs, loaded, load, addClub, updateClub, removeClub, bySection } = useBagStore();

  // Sheet open state — animates in/out
  const [activeSection, setActiveSection] = useState<BagSection | null>(null);
  // Content state — held until close animation finishes
  const [displaySection, setDisplaySection] = useState<BagSection | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showAddClub, setShowAddClub] = useState(false);
  const [addSlot, setAddSlot] = useState('');
  const [addCatalogId, setAddCatalogId] = useState('');
  const [addBrand, setAddBrand] = useState('');
  const [addModel, setAddModel] = useState('');
  const [addLoft, setAddLoft] = useState('');
  const [addCarry, setAddCarry] = useState('');
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);

  function resetAddForm() {
    setAddSlot(''); setAddCatalogId(''); setAddBrand(''); setAddModel('');
    setAddLoft(''); setAddCarry(''); setAddError('');
  }

  useEffect(() => {
    if (!user) { router.replace('/auth'); return; }
    if (!loaded) load();
  }, [user, loaded, load, router]);

  useEffect(() => () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }, []);

  if (!user) return null;

  function openSection(s: BagSection) {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setDisplaySection(s);
    setActiveSection(s);
  }

  function closeSection() {
    setActiveSection(null);
    closeTimerRef.current = setTimeout(() => setDisplaySection(null), 320);
  }

  function handleBagSelect(s: BagSection) {
    if (activeSection === s) closeSection();
    else openSection(s);
  }

  async function handleAddClub() {
    if (!addSlot) { setAddError('Select a slot'); return; }
    setSaving(true); setAddError('');
    try {
      await addClub({
        catalogId: addCatalogId || undefined,
        slot: addSlot,
        brand: addBrand.trim() || undefined,
        model: addModel.trim() || undefined,
        loft: addLoft ? parseFloat(addLoft) : undefined,
        carry: addCarry ? parseInt(addCarry, 10) : undefined,
        carryIsEstimate: !addCarry,
      });
      setShowAddClub(false);
      resetAddForm();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to add club');
    } finally {
      setSaving(false);
    }
  }

  function selectCatalogClub(id: string) {
    setAddCatalogId(id);
    const cat = CLUBS.find((c) => c.id === id);
    setAddBrand(cat?.brand ?? '');
    setAddModel(cat?.model ?? '');
    setAddLoft(String(cat?.stockLoft ?? cat?.stock7iLoft ?? ''));
  }

  const allSlots = [
    'driver','3w','5w','7w','3h','4h','5h',
    '2i','3i','4i','5i','6i','7i','8i','9i','PW',
    'GW','AW','SW','LW','50w','52w','54w','56w','58w','60w','putter',
  ];
  const filteredCatalog = addSlot
    ? CLUBS.filter((c) => {
        if (addSlot === 'driver') return c.type === 'driver';
        if (['3w','5w','7w'].includes(addSlot)) return c.type === 'fw';
        if (['3h','4h','5h'].includes(addSlot)) return c.type === 'hybrid';
        if (/^\d+i$/.test(addSlot) || addSlot === 'PW') return c.type === 'iron';
        if (['GW','AW','SW','LW','50w','52w','54w','56w','58w','60w'].includes(addSlot)) return c.type === 'wedge';
        if (addSlot === 'putter') return c.type === 'putter';
        return true;
      }).slice(0, 50)
    : [];

  return (
    <AppShell>
      <div className="bg-paper min-h-full pb-6">
        {/* Header row */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div>
            <div className="font-display font-extrabold tracking-[0.12em] text-[11px] text-ink-soft uppercase">
              My Bag
            </div>
            <div className="text-[13px] text-ink stat-num font-semibold mt-0.5">
              {clubs.length}
              <span className="text-ink-muted text-[11px] font-normal"> / 14 clubs</span>
            </div>
          </div>
          <button
            onClick={() => setShowAddClub(true)}
            className="flex items-center gap-1.5 bg-turf text-white font-display tracking-wider text-[10px] px-3.5 py-2 rounded-xl hover:bg-turf-light active:scale-95 transition-all"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            ADD CLUB
          </button>
        </div>

        {/* Bag — top-down view with built-in section tabs */}
        <div className="flex flex-col items-center px-2 pt-1">
          <div className="w-full max-w-[340px]">
            <StandBag clubs={clubs} active={activeSection} onSelect={handleBagSelect} />
          </div>
          <div className="text-[10px] text-ink-muted mt-1 text-center">
            Tap a section of the bag, or its tab, to view clubs
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/25 transition-opacity duration-300"
        style={{
          opacity: activeSection ? 1 : 0,
          pointerEvents: activeSection ? 'auto' : 'none',
        }}
        onClick={closeSection}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out"
        style={{
          transform: activeSection ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: '68vh',
        }}
      >
        {displaySection && (
          <SectionDetail
            section={displaySection}
            clubs={bySection(displaySection)}
            onClose={closeSection}
            onUpdateCarry={(id, carry) => updateClub(id, { carry, carryIsEstimate: false })}
            onRemove={(id) => removeClub(id)}
          />
        )}
      </div>

      {/* Add club modal */}
      {showAddClub && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-elevated w-full max-w-sm p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="eyebrow text-turf">Add Club</div>
              <button
                onClick={() => { setShowAddClub(false); resetAddForm(); }}
                className="w-7 h-7 rounded-full bg-paper flex items-center justify-center text-ink-muted hover:text-ink text-base leading-none"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">Slot</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-paper outline-none focus:border-turf"
                value={addSlot}
                onChange={(e) => { setAddSlot(e.target.value); setAddCatalogId(''); setAddBrand(''); setAddModel(''); setAddLoft(''); }}
              >
                <option value="">Select slot…</option>
                {allSlots.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {addSlot && filteredCatalog.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">
                  Quick pick from catalog <span className="text-ink-muted font-normal">(optional)</span>
                </label>
                <select
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-paper outline-none focus:border-turf"
                  value={addCatalogId}
                  onChange={(e) => (e.target.value ? selectCatalogClub(e.target.value) : setAddCatalogId(''))}
                >
                  <option value="">— choose to autofill, or type below —</option>
                  {filteredCatalog.map((c: ClubModel) => (
                    <option key={c.id} value={c.id}>{c.brand} {c.model} ({c.year})</option>
                  ))}
                </select>
                <div className="text-[10px] text-ink-muted mt-1">
                  Not in the list? Just type the brand and model yourself below — any club works.
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">
                  Brand <span className="text-ink-muted font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-paper outline-none focus:border-turf"
                  placeholder="e.g. Callaway"
                  value={addBrand}
                  onChange={(e) => setAddBrand(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">
                  Model <span className="text-ink-muted font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-paper outline-none focus:border-turf"
                  placeholder="e.g. Big Bertha"
                  value={addModel}
                  onChange={(e) => setAddModel(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">
                  Loft <span className="text-ink-muted font-normal">(°, optional)</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-paper outline-none focus:border-turf"
                  placeholder="e.g. 10.5"
                  value={addLoft}
                  onChange={(e) => setAddLoft(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">
                  Carry <span className="text-ink-muted font-normal">(yd, optional)</span>
                </label>
                <input
                  type="number"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-paper outline-none focus:border-turf"
                  placeholder="Auto-estimate"
                  value={addCarry}
                  onChange={(e) => setAddCarry(e.target.value)}
                />
              </div>
            </div>

            {addError && <p className="text-xs text-flag">{addError}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setShowAddClub(false); resetAddForm(); }}
                className="flex-1 border border-border text-ink-soft text-sm font-semibold py-2.5 rounded-xl hover:border-turf/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClub}
                disabled={!addSlot || saving}
                className="flex-1 bg-turf text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 hover:bg-turf-light transition-colors"
              >
                {saving ? 'Adding…' : 'Add Club'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
