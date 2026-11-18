import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  FileText,
  Check,
  Presentation,
  Leaf,
} from 'lucide-react';
import {
  Product,
  Order,
  User,
  CountryLocation,
  FinancialRecord,
  SystemActivity,
} from '../types';
import {
  buildFlorentineSlides,
  exportFlorentinePptx,
  PresentationSlideData,
} from '../services/pptxGenerator';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  locations: CountryLocation[];
  orders: Order[];
  users: User[];
  financialRecords: FinancialRecord[];
  activities: SystemActivity[];
  currentUser: User | null;
  onShowToast?: (message: string) => void;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  isOpen,
  onClose,
  products,
  locations,
  orders,
  users,
  financialRecords,
  activities,
  currentUser,
  onShowToast,
}) => {
  const [deckTitle, setDeckTitle] = useState('Florentine-Green (Fofo Green)');
  const [deckSubtitle, setDeckSubtitle] = useState(
    'A Digital Farm-to-Table Organic Produce Ecosystem Connecting Rwandan Cooperatives With Communities Everywhere'
  );
  const [presenterName, setPresenterName] = useState(
    currentUser?.role === 'admin'
      ? currentUser.name
      : 'Florentine Mushimiyimana'
  );

  const slides = useMemo(
    () =>
      buildFlorentineSlides({
        deckTitle,
        deckSubtitle,
        presenterName,
        products,
        locations,
        orders,
        users,
        financialRecords,
        activities,
      }),
    [
      deckTitle,
      deckSubtitle,
      presenterName,
      products,
      locations,
      orders,
      users,
      financialRecords,
      activities,
    ]
  );

  const [selectedSlideIds, setSelectedSlideIds] = useState<string[]>(() =>
    slides.map((s) => s.id)
  );
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(true);
  const [showCustomizeDrawer, setShowCustomizeDrawer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setExportError(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        setActiveSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setActiveSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, slides.length, isFullscreen, onClose]);

  if (!isOpen) return null;

  const activeSlide: PresentationSlideData =
    slides[activeSlideIndex] || slides[0];

  const toggleSlideIncluded = (slideId: string) => {
    setSelectedSlideIds((prev) => {
      if (prev.includes(slideId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== slideId);
      }
      return [...prev, slideId];
    });
  };

  const handleExportPowerPoint = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportError(null);
    setExportStatus(null);
    try {
      const result = await exportFlorentinePptx({
        deckTitle,
        deckSubtitle,
        presenterName,
        products,
        locations,
        orders,
        users,
        financialRecords,
        activities,
        selectedSlideIds,
        fileName: 'Florentine-Green-Presentation.pptx',
      });
      const msg = `Downloaded ${result.fileName} (${result.slideCount} slides)`;
      setExportStatus(msg);
      onShowToast?.(msg);
    } catch (err: any) {
      setExportError(
        err?.message || 'Could not generate PowerPoint file. Please try again.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Florentine-Green PowerPoint Presentation Studio"
    >
      <div
        className={`bg-[#FBF9F5] text-stone-900 flex flex-col overflow-hidden border border-stone-200 shadow-2xl ${
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-7xl h-[92vh] rounded-2xl'
        }`}
      >
        {/* Clean Editorial Top Studio Bar */}
        <header className="bg-white border-b border-stone-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-900 text-white flex items-center justify-center shrink-0">
              <Presentation className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 truncate">
                Florentine-Green Presentation Studio
              </h2>
              <p className="text-xs text-stone-500 truncate">
                Live platform metrics · {selectedSlideIds.length} of {slides.length} slides selected · 16:9 PowerPoint (.pptx)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowCustomizeDrawer((prev) => !prev)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                showCustomizeDrawer
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Customize Deck</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSpeakerNotes((prev) => !prev)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                showSpeakerNotes
                  ? 'bg-stone-100 text-stone-900 border-stone-300'
                  : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Speaker Notes</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 cursor-pointer transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Present Fullscreen'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Present Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleExportPowerPoint}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isExporting
                  ? 'Building .pptx...'
                  : 'Download PowerPoint (.pptx)'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer transition-colors"
              aria-label="Close Presentation Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Export Feedback Strip */}
        {(exportStatus || exportError) && (
          <div
            className={`px-6 py-2 text-xs font-medium border-b flex items-center justify-between shrink-0 ${
              exportError
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}
          >
            <span>{exportError || exportStatus}</span>
            <button
              type="button"
              onClick={() => {
                setExportError(null);
                setExportStatus(null);
              }}
              className="text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Studio Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Slide Index Rail */}
          {!isFullscreen && (
            <aside className="hidden md:flex w-72 bg-white border-r border-stone-200 flex-col shrink-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between text-xs text-stone-500">
                <span className="font-semibold text-stone-800">
                  Slide Outline
                </span>
                <span className="tabular-nums">
                  {selectedSlideIds.length} selected
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {slides.map((s, idx) => {
                  const isActive = idx === activeSlideIndex;
                  const isIncluded = selectedSlideIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      className={`p-3 rounded-xl border transition-colors ${
                        isActive
                          ? 'bg-emerald-50/70 border-emerald-700'
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveSlideIndex(idx)}
                          className="flex-1 text-left cursor-pointer min-w-0"
                        >
                          <div className="text-[11px] font-mono tabular-nums text-stone-500">
                            {s.indexNumber}
                          </div>
                          <div className="text-xs font-semibold text-stone-900 truncate mt-0.5">
                            {s.title}
                          </div>
                          <div className="text-[11px] text-stone-500 truncate mt-0.5">
                            {s.layout === 'table'
                              ? 'Structured Data Table'
                              : s.layout === 'cover'
                              ? 'Title & Hero Image'
                              : s.layout === 'photo-editorial'
                              ? 'Objectives & Photo'
                              : s.layout === 'comparison-columns'
                              ? 'Two-Column Analysis'
                              : s.layout === 'closing-qa'
                              ? 'Testing & Q&A Close'
                              : 'Editorial Layout'}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSlideIncluded(s.id)}
                          aria-label={
                            isIncluded
                              ? `Exclude slide ${s.indexNumber}`
                              : `Include slide ${s.indexNumber}`
                          }
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                            isIncluded
                              ? 'bg-emerald-800 border-emerald-800 text-white'
                              : 'bg-white border-stone-300 text-transparent hover:border-stone-500'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          )}

          {/* Center 16:9 Slide Stage + Optional Customize / Notes Panels */}
          <main className="flex-1 flex flex-col overflow-hidden bg-[#F3EFE7]">
            {showCustomizeDrawer && (
              <div className="bg-white border-b border-stone-200 px-4 sm:px-6 py-3 grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Presentation Title
                  </label>
                  <input
                    type="text"
                    value={deckTitle}
                    onChange={(e) => setDeckTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Presenter Name
                  </label>
                  <input
                    type="text"
                    value={presenterName}
                    onChange={(e) => setPresenterName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Deck Subtitle
                  </label>
                  <input
                    type="text"
                    value={deckSubtitle}
                    onChange={(e) => setDeckSubtitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-900 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Centered 16:9 Slide Viewport */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 flex flex-col items-center justify-center">
              <div
                className={`w-full max-w-5xl aspect-video rounded-xl border overflow-hidden shadow-lg flex flex-col justify-between p-5 sm:p-8 transition-colors ${
                  activeSlide.darkTheme
                    ? 'bg-[#022C22] text-stone-100 border-emerald-900'
                    : 'bg-[#FBF9F5] text-stone-900 border-stone-300'
                }`}
              >
                {/* Slide Top Header Line */}
                <div
                  className={`flex items-center justify-between pb-2.5 border-b text-[11px] uppercase tracking-widest ${
                    activeSlide.darkTheme
                      ? 'border-emerald-800 text-emerald-200'
                      : 'border-stone-300 text-emerald-800'
                  }`}
                >
                  <span className="font-semibold truncate">
                    {activeSlide.kicker}
                  </span>
                  <span className="font-mono tabular-nums shrink-0 ml-3">
                    {activeSlide.indexNumber} / {String(slides.length).padStart(2, '0')}
                  </span>
                </div>

                {/* Slide Body */}
                <div className="flex-1 py-4 flex flex-col justify-center overflow-hidden">
                  {activeSlide.layout === 'cover' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch h-full">
                      <div className="lg:col-span-6 flex flex-col justify-between">
                        <div>
                          <h1 className="font-serif font-bold text-2xl sm:text-4xl text-white leading-tight">
                            {activeSlide.title}
                          </h1>
                          <p className="text-xs sm:text-sm text-stone-200 mt-3 leading-relaxed">
                            {activeSlide.subtitle}
                          </p>
                        </div>

                        <div className="space-y-2 mt-4">
                          {(activeSlide.highlights || []).map((hl, i) => (
                            <div
                              key={i}
                              className="p-2.5 rounded-lg bg-[#064E3B] border border-emerald-800"
                            >
                              <div className="text-xs font-semibold text-emerald-200">
                                {hl.title}
                              </div>
                              <div className="text-[11px] text-stone-200 mt-0.5">
                                {hl.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="lg:col-span-6 flex flex-col">
                        <div className="flex-1 rounded-xl overflow-hidden border border-emerald-800 bg-emerald-950 flex items-center justify-center">
                          {activeSlide.imageUrl ? (
                            <img
                              src={activeSlide.imageUrl}
                              alt="Florentine-Green Organic Produce Harvest"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-emerald-300 p-6">
                              <Leaf className="w-8 h-8" />
                              <span className="text-xs">{activeSlide.title}</span>
                            </div>
                          )}
                        </div>
                        {activeSlide.imageCaption && (
                          <p className="text-[11px] font-serif italic text-emerald-200 mt-2">
                            {activeSlide.imageCaption}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full justify-between gap-4">
                      <div>
                        <h3 className="font-serif font-bold text-xl sm:text-3xl text-stone-900">
                          {activeSlide.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-3xl">
                          {activeSlide.subtitle}
                        </p>
                      </div>

                      {activeSlide.layout === 'metrics-split' && (
                        <div className="space-y-3 my-auto">
                          <div className="grid grid-cols-2 gap-3">
                            {(activeSlide.metrics || []).map((m, i) => (
                              <div
                                key={i}
                                className="p-3.5 rounded-xl bg-white border border-stone-200"
                              >
                                <div className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                                  {m.label}
                                </div>
                                <div className="text-xl sm:text-2xl font-serif font-bold text-emerald-900 mt-1 tabular-nums">
                                  {m.value}
                                </div>
                                <div className="text-[11px] text-stone-600 mt-1">
                                  {m.detail}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(activeSlide.highlights || []).map((hl, i) => (
                              <div
                                key={i}
                                className="p-3 rounded-xl bg-[#F2EFE9] border border-stone-200"
                              >
                                <div className="text-xs font-semibold text-stone-900">
                                  {hl.title}
                                </div>
                                <div className="text-[11px] text-stone-600 mt-0.5">
                                  {hl.description}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeSlide.layout === 'photo-editorial' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch my-auto">
                          <div className="lg:col-span-6 flex flex-col">
                            <div className="flex-1 rounded-xl overflow-hidden border border-stone-300 bg-stone-200">
                              {activeSlide.imageUrl ? (
                                <img
                                  src={activeSlide.imageUrl}
                                  alt="Kigali Farm Produce Dispatch Hub"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-500 p-6">
                                  <Leaf className="w-8 h-8" />
                                </div>
                              )}
                            </div>
                            {activeSlide.imageCaption && (
                              <p className="text-[11px] font-serif italic text-stone-500 mt-1.5">
                                {activeSlide.imageCaption}
                              </p>
                            )}
                          </div>
                          <div className="lg:col-span-6 space-y-2.5 flex flex-col justify-between">
                            {(activeSlide.highlights || []).map((hl, i) => (
                              <div
                                key={i}
                                className="p-3 rounded-xl bg-white border border-stone-200"
                              >
                                <div className="text-xs font-semibold text-emerald-900">
                                  {hl.title}
                                </div>
                                <div className="text-[11px] text-stone-600 mt-0.5">
                                  {hl.description}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeSlide.layout === 'table' && (
                        <div className="space-y-3 my-auto">
                          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-emerald-900 text-white">
                                  {(activeSlide.tableHeaders || []).map((th, i) => (
                                    <th
                                      key={i}
                                      className="px-3 py-2 font-semibold whitespace-nowrap"
                                    >
                                      {th}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(activeSlide.tableRows || []).map((row, rIdx) => (
                                  <tr
                                    key={rIdx}
                                    className={
                                      rIdx % 2 === 0 ? 'bg-white' : 'bg-[#F6F3EC]'
                                    }
                                  >
                                    {row.map((cell, cIdx) => (
                                      <td
                                        key={cIdx}
                                        className="px-3 py-2 border-t border-stone-200 text-stone-800 tabular-nums"
                                      >
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(activeSlide.highlights || []).map((hl, i) => (
                              <div
                                key={i}
                                className="p-3 rounded-xl bg-white border border-stone-200"
                              >
                                <div className="text-xs font-semibold text-emerald-900">
                                  {hl.title}
                                </div>
                                <div className="text-[11px] text-stone-600 mt-0.5">
                                  {hl.description}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeSlide.layout === 'grid-pillars' && (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 my-auto">
                          {(activeSlide.highlights || []).map((hl, i) => (
                            <div
                              key={i}
                              className="p-3.5 rounded-xl bg-white border border-stone-200"
                            >
                              <div className="font-serif font-bold text-xs sm:text-sm text-emerald-900">
                                {hl.title}
                              </div>
                              <div className="text-[11px] text-stone-600 mt-1.5 leading-relaxed">
                                {hl.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeSlide.layout === 'comparison-columns' && (
                        <div className="space-y-3 my-auto">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                            {(activeSlide.columns || []).map((col, cIdx) => (
                              <div
                                key={cIdx}
                                className={`p-3.5 rounded-xl border ${
                                  col.dark
                                    ? 'bg-[#022C22] text-white border-emerald-900'
                                    : 'bg-white text-stone-900 border-stone-200'
                                }`}
                              >
                                <div
                                  className={`text-[11px] uppercase tracking-wider font-semibold mb-2.5 ${
                                    col.dark ? 'text-emerald-300' : 'text-emerald-900'
                                  }`}
                                >
                                  {col.heading}
                                </div>
                                <div className="space-y-2.5">
                                  {col.items.map((item, iIdx) => (
                                    <div key={iIdx}>
                                      <div
                                        className={`font-serif font-bold text-xs sm:text-[13px] ${
                                          col.dark ? 'text-white' : 'text-stone-900'
                                        }`}
                                      >
                                        {item.title}
                                      </div>
                                      <div
                                        className={`text-[11px] mt-0.5 leading-snug ${
                                          col.dark ? 'text-stone-200' : 'text-stone-600'
                                        }`}
                                      >
                                        {item.description}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          {activeSlide.summaryStatement && (
                            <div className="p-3 rounded-xl bg-[#F2EFE9] border border-stone-200 text-xs text-stone-800">
                              <span className="font-semibold uppercase tracking-wider text-emerald-900 mr-2">
                                {activeSlide.summaryStatement.label}:
                              </span>
                              <span>{activeSlide.summaryStatement.text}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {activeSlide.layout === 'roadmap' && (
                        <div className="space-y-3 my-auto">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {(activeSlide.highlights || []).map((hl, i) => (
                              <div
                                key={i}
                                className="p-3.5 rounded-xl bg-white border border-stone-200"
                              >
                                <div className="font-serif font-bold text-xs sm:text-sm text-emerald-900">
                                  {hl.title}
                                </div>
                                <div className="text-[11px] text-stone-600 mt-1.5 leading-relaxed">
                                  {hl.description}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(activeSlide.metrics || []).map((m, i) => (
                              <div
                                key={i}
                                className="p-3.5 rounded-xl bg-[#022C22] text-white border border-emerald-900"
                              >
                                <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">
                                  {m.label}
                                </div>
                                <div className="font-serif font-bold text-base sm:text-lg mt-0.5">
                                  {m.value}
                                </div>
                                <div className="text-[11px] text-stone-300 mt-0.5">
                                  {m.detail}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeSlide.layout === 'closing-qa' && (
                        <div className="space-y-2.5 my-auto">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {(activeSlide.highlights || []).map((hl, i) => (
                              <div
                                key={i}
                                className="p-3 rounded-xl bg-white border border-stone-200"
                              >
                                <div className="font-serif font-bold text-xs sm:text-sm text-emerald-900">
                                  {hl.title}
                                </div>
                                <div className="text-[11px] text-stone-600 mt-1 leading-snug">
                                  {hl.description}
                                </div>
                              </div>
                            ))}
                          </div>
                          {activeSlide.summaryStatement && (
                            <div className="p-3 rounded-xl bg-[#F2EFE9] border border-stone-200">
                              <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-900">
                                {activeSlide.summaryStatement.label}
                              </div>
                              <div className="text-xs text-stone-800 mt-1 leading-snug">
                                {activeSlide.summaryStatement.text}
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(activeSlide.metrics || []).map((m, i) => (
                              <div
                                key={i}
                                className="p-3 rounded-xl bg-[#022C22] text-white border border-emerald-900"
                              >
                                <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">
                                  {m.label}
                                </div>
                                <div className="font-serif font-bold text-sm sm:text-base mt-0.5">
                                  {m.value}
                                </div>
                                <div className="text-[11px] text-stone-300 mt-0.5">
                                  {m.detail}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Slide Footer Attribution */}
                <div
                  className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                    activeSlide.darkTheme
                      ? 'border-emerald-900 text-emerald-200'
                      : 'border-stone-200 text-stone-500'
                  }`}
                >
                  <span>
                    Florentine-Green (Fofo Green Rwanda) · {presenterName || 'Florentine Mushimiyimana'}
                  </span>
                  <span className="tabular-nums">
                    {selectedSlideIds.includes(activeSlide.id)
                      ? 'Included in .pptx export'
                      : 'Excluded from .pptx export'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Controls + Speaker Notes */}
            <div className="bg-white border-t border-stone-200 px-4 sm:px-6 py-3 shrink-0 space-y-2.5">
              {showSpeakerNotes && (
                <div className="px-3.5 py-2 rounded-xl bg-[#FBF9F5] border border-stone-200 text-xs text-stone-700">
                  <span className="font-semibold text-stone-900 mr-2">
                    Speaker Notes:
                  </span>
                  <span>{activeSlide.speakerNotes}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setActiveSlideIndex((prev) => Math.max(0, prev - 1))
                  }
                  disabled={activeSlideIndex === 0}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40 text-xs font-semibold text-stone-800 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                  {slides.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono tabular-nums cursor-pointer transition-colors ${
                        idx === activeSlideIndex
                          ? 'bg-emerald-800 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {s.indexNumber}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActiveSlideIndex((prev) =>
                      Math.min(slides.length - 1, prev + 1)
                    )
                  }
                  disabled={activeSlideIndex === slides.length - 1}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40 text-xs font-semibold text-stone-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
