'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useBagStore, type BagSection } from '@/stores/bag';
import { AppShell } from '@/components/layout/AppShell';
import { StandBag } from '@/components/bag/StandBag';
import { SectionDetail } from '@/components/bag/SectionDetail';
import { CLUBS, type ClubModel } from '@/data/clubs';

const SECTION_COUNTS = (clubs: ReturnType<typeof useBagStore.getState>['clubs']) => ({
  woods:  clubs.filter((c) => ['driver','3w','5w','7w','3h','4h','5h'].includes(c.slot)).length,
  irons:  clubs.filter((c) => ['2i','3i','4i','5i','6i','7i','8i','9i','PW'].includes(c.slot)).length,
  wedges: clubs.filter((c) => ['GW','AW','SW','LW','46w','48w','50w','52w','54w','56w','58w','60w'].includes(c.slot)).length,
  putter: clubs.filter((c) => c.slot === 'putter').length,
});

const SECTION_META: Record<BagSection, { label: string; color: string; accent: string }> = {
  woods:  { label: 'Woods',  color: '#2F6B44', accent: '#4A8A5E' },
  irons:  { label: 'Irons',  color: '#3B7DC4', accent: '#5A97D4' },
  wedges: { label: 'Wedges', color: '#B8860B', accent: '#D4A820' },
  putter: { label: 'Putter', color: '#C2492E', accent: '#D86A52' },
};

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
  const [addCarry, setAddCarry] = useState('');
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.replace('/auth'); return; }
    if (!loaded) load();
  }, [user, loaded, load, router]);

  useEffect(() => () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }, []);

  if (!user) return null;

  const counts = SECTION_COUNTS(clubs);

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
      const cat = CLUBS.find((c) => c.id === addCatalogId);
      await addClub({
        catalogId: addCatalogId || undefined,
        slot: addSlot,
        brand: cat?.brand,
        model: cat?.model,
        carry: addCarry ? parseInt(addCarry, 10) : undefined,
        carryIsEstimate: !addCarry,
      });
      setShowAddClub(false);
      setAddSlot(''); setAddCatalogId(''); setAddCarry('');
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to add club');
    } finally {
      setSaving(false);
    }
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

        {/* Bag + chips */}
        <div className="flex flex-col items-center px-4 pt-1">
          {/* Stand bag SVG */}
          <div className="w-full max-w-[240px]">
            <StandBag counts={counts} active={activeSection} onSelect={handleBagSelect} />
          </div>

          {/* Section chips */}
          <div className="mt-5 w-full max-w-[320px] grid grid-cols-4 gap-2">
            {(Object.entries(SECTION_META) as [BagSection, typeof SECTION_META[BagSection]][]).map(
              ([s, meta]) => {
                const isActive = activeSection === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleBagSelect(s)}
                    className="flex flex-col items-center py-2.5 rounded-xl border transition-all active:scale-95"
                    style={
                      isActive
                        ? {
                            backgroundColor: meta.color + '14',
                            borderColor: meta.color + '50',
                          }
                        : { backgroundColor: '#FFFFFF', borderColor: '#E2E0D8' }
                    }
                  >
                    <div
                      className="text-sm font-display font-extrabold stat-num leading-none"
                      style={{ color: isActive ? meta.color : '#9BA3A5' }}
                    >
                      {counts[s]}
                    </div>
                    <div
                      className="text-[8px] font-display tracking-widest mt-0.5 uppercase leading-none"
                      style={{ color: isActive ? meta.accent : '#9BA3A5' }}
                    >
                      {meta.label}
                    </div>
                  </button>
                );
              }
            )}
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
          <div className="bg-card border border-border rounded-2xl shadow-elevated w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="eyebrow text-turf">Add Club</div>
              <button
                onClick={() => {
                  setShowAddClub(false);
                  setAddSlot(''); setAddCatalogId(''); setAddCarry(''); setAddError('');
                }}
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
                onChange={(e) => { setAddSlot(e.target.value); setAddCatalogId(''); }}
              >
                <option value="">Select slot…</option>
                {allSlots.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {addSlot && filteredCatalog.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">
                  Model <span className="text-ink-muted font-normal">(optional)</span>
                </label>
                <select
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-paper outline-none focus:border-turf"
                  value={addCatalogId}
                  onChange={(e) => setAddCatalogId(e.target.value)}
                >
                  <option value="">Generic / custom</option>
                  {filteredCatalog.map((c: ClubModel) => (
                    <option key={c.id} value={c.id}>{c.brand} {c.model} ({c.year})</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">
                Carry distance <span className="text-ink-muted font-normal">(yd, optional)</span>
              </label>
              <input
                type="number"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-paper outline-none focus:border-turf"
                placeholder="Leave blank to auto-estimate"
                value={addCarry}
                onChange={(e) => setAddCarry(e.target.value)}
              />
            </div>

            {addError && <p className="text-xs text-flag">{addError}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setShowAddClub(false);
                  setAddSlot(''); setAddCatalogId(''); setAddCarry(''); setAddError('');
                }}
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
