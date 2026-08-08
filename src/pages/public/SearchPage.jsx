import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Search, SlidersHorizontal, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { format, addDays, differenceInDays, isValid, parseISO } from 'date-fns';
import Navbar from '../../components/core/Navbar';
import FilterPanel from '../../components/search/FilterPanel';
import SearchResultCard from '../../components/search/SearchResultCard';
import searchApi from '../../api/searchApi';
import { useCurrency } from '../../hooks/useCurrency';
import { parseApiError } from '../../utils/parseApiError';
import Footer from '../../components/core/Footer';

const DEFAULT_FILTERS = {
  checkIn: '',
  checkOut: '',
  city: '',
  country: '',
  minPrice: '',
  maxPrice: '',
  roomType: '',
  maxOccupancy: null,
  hotelIds: [],
  tag: '',
};
const DEFAULT_SORT = 'price_asc';
const DEFAULT_PAGE = 0;
const todayString = format(new Date(), 'yyyy-MM-dd');

const SearchPage = () => {
  const { currency } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [results, setResults] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const debounceRef = useRef(null);
  const mountedRef = useRef(false);
  const resultsRef = useRef(null);

  const nights = useMemo(() => {
    if (!filters.checkIn || !filters.checkOut) return 0;
    const start = parseISO(filters.checkIn);
    const end = parseISO(filters.checkOut);
    if (!isValid(start) || !isValid(end)) return 0;
    return Math.max(differenceInDays(end, start), 0);
  }, [filters.checkIn, filters.checkOut]);

  const buildParams = (activeFilters, activeSort, activePage) => {
    const params = {};
    if (activeFilters.checkIn) params.checkIn = activeFilters.checkIn;
    if (activeFilters.checkOut) params.checkOut = activeFilters.checkOut;
    if (activeFilters.city) params.city = activeFilters.city;
    if (activeFilters.country) params.country = activeFilters.country;
    if (activeFilters.minPrice !== '') params.minPrice = Number(activeFilters.minPrice);
    if (activeFilters.maxPrice !== '') params.maxPrice = Number(activeFilters.maxPrice);
    if (activeFilters.roomType) params.roomType = activeFilters.roomType;
    if (activeFilters.maxOccupancy) params.maxOccupancy = activeFilters.maxOccupancy;
    if (activeFilters.hotelIds?.length) params.hotelId = activeFilters.hotelIds.join(',');
    // Single-tag selection only (per backend contract, `tags` is AND-matched — selecting both
    // would only return rooms that are both eco- and work-friendly, not either one).
    if (activeFilters.tag) params.tags = activeFilters.tag;
    // Backend converts minPrice/maxPrice into each result branch's own currency before
    // filtering, so this always has to travel with them for the filter to stay accurate.
    params.filterCurrency = currency;
    params.page = activePage;
    params.size = 12;
    if (activeSort) params.sort = activeSort;
    return params;
  };

  const syncUrl = (activeFilters, activeSort, activePage) => {
    const params = new URLSearchParams();
    if (activeFilters.checkIn) params.set('checkIn', activeFilters.checkIn);
    if (activeFilters.checkOut) params.set('checkOut', activeFilters.checkOut);
    if (activeFilters.city) params.set('city', activeFilters.city);
    if (activeFilters.country) params.set('country', activeFilters.country);
    if (activeFilters.minPrice !== '') params.set('minPrice', String(activeFilters.minPrice));
    if (activeFilters.maxPrice !== '') params.set('maxPrice', String(activeFilters.maxPrice));
    if (activeFilters.roomType) params.set('roomType', activeFilters.roomType);
    if (activeFilters.maxOccupancy) params.set('maxOccupancy', String(activeFilters.maxOccupancy));
    if (activeFilters.hotelIds?.length) params.set('hotelId', activeFilters.hotelIds.join(','));
    if (activeFilters.tag) params.set('tag', activeFilters.tag);
    if (activeSort && activeSort !== DEFAULT_SORT) params.set('sort', activeSort);
    if (activePage && activePage !== DEFAULT_PAGE) params.set('page', String(activePage));
    setSearchParams(params);
  };

  const performSearch = async (activeFilters, activePage, activeSort) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await searchApi.searchRooms(buildParams(activeFilters, activeSort, activePage));
      setResults(response.content || []);
      setTotalElements(response.totalElements || 0);
      setCurrentPage(response.number ?? activePage);
      setHasSearched(true);
      syncUrl(activeFilters, activeSort, response.number ?? activePage);
    } catch (err) {
      // Surface the backend's real message (e.g. an unconvertable branch currency in scope)
      // as-is — never silently retry without filterCurrency, that would just mask it again.
      setError(parseApiError(err, 'Unable to load rooms.'));
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initialFilters = {
      ...DEFAULT_FILTERS,
      checkIn: searchParams.get('checkIn') || '',
      checkOut: searchParams.get('checkOut') || '',
      city: searchParams.get('city') || '',
      country: searchParams.get('country') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      roomType: searchParams.get('roomType') || '',
      maxOccupancy: searchParams.get('maxOccupancy') ? Number(searchParams.get('maxOccupancy')) : null,
      hotelIds: searchParams.get('hotelId') ? searchParams.get('hotelId').split(',') : [],
      tag: ['ECO_FRIENDLY', 'WORK_FRIENDLY'].includes(searchParams.get('tag')) ? searchParams.get('tag') : '',
    };
    const initialSort = ['price_asc', 'price_desc', 'rating_desc'].includes(searchParams.get('sort'))
      ? searchParams.get('sort')
      : DEFAULT_SORT;
    const initialPage = Number.isInteger(Number(searchParams.get('page'))) && Number(searchParams.get('page')) >= 0
      ? Number(searchParams.get('page'))
      : DEFAULT_PAGE;

    setFilters(initialFilters);
    setSort(initialSort);
    setCurrentPage(initialPage);

    if (initialFilters.checkIn && initialFilters.checkOut) {
      performSearch(initialFilters, initialPage, initialSort);
    }

    mountedRef.current = true;
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      performSearch(filters, DEFAULT_PAGE, sort);
      setCurrentPage(DEFAULT_PAGE);
    }, 300);
    return () => clearTimeout(debounceRef.current);
    // Re-searching on currency change keeps the price filter's result set accurate as the
    // user switches currency, not just the labels on the slider.
  }, [filters, currency]);

  const handleFilterChange = (key, value) => {
    setFilters((previous) => {
      const nextFilters = { ...previous, [key]: value };
      if (key === 'checkIn' && nextFilters.checkOut && nextFilters.checkOut <= value) {
        nextFilters.checkOut = '';
      }
      return nextFilters;
    });
    setCurrentPage(DEFAULT_PAGE);
  };

  const handleSortChange = (value) => {
    setSort(value);
    setCurrentPage(DEFAULT_PAGE);
    performSearch(filters, DEFAULT_PAGE, value);
  };

  const handlePageChange = (pageIndex) => {
    if (pageIndex === currentPage) return;
    setCurrentPage(pageIndex);
    performSearch(filters, pageIndex, sort);
    if (resultsRef.current) {
      window.scrollTo({ top: resultsRef.current.offsetTop - 24, behavior: 'smooth' });
    }
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSort(DEFAULT_SORT);
    setCurrentPage(DEFAULT_PAGE);
    setError(null);
    setResults([]);
    setTotalElements(0);
    setHasSearched(false);
    setSearchParams({});
  };

  const pageButtons = () => {
    if (totalElements <= 0) return [];
    const totalPages = Math.ceil(totalElements / 12);
    if (totalPages <= 1) return [];
    let start = Math.max(0, currentPage - 2);
    let end = Math.min(totalPages - 1, start + 4);
    if (end - start < 4) {
      start = Math.max(0, end - 4);
    }
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  };

  const totalPages = Math.ceil(totalElements / 12);
  const showingFrom = totalElements > 0 ? currentPage * 12 + 1 : 0;
  const showingTo = Math.min((currentPage + 1) * 12, totalElements);

  return (
      <div className="min-h-screen bg-[#F8F9FA] text-slate-900">
        <Navbar />
        <main className="mx-auto flex max-w-355 flex-col gap-6 px-4 py-20 lg:px-8">
          <div className="flex items-center justify-between gap-4 rounded-[28px] bg-white px-6 py-6 shadow-sm">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Find your stay</p>
              <h1 className="mt-2 text-3xl font-[Playfair_Display] font-semibold text-[#1A1A2E]">Search for your perfect room</h1>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#0A7C6E] hover:text-[#0A7C6E] lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="hidden lg:block">
              <FilterPanel filters={filters} onFilterChange={handleFilterChange} onClear={handleClearFilters} />
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-4 rounded-[28px] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                <div>
                  <p className="text-sm text-slate-500">
                    {totalElements > 0
                      ? `Showing ${showingFrom}–${showingTo} of ${totalElements} available rooms`
                      : hasSearched
                      ? 'No rooms found'
                      : 'Refine your filters to start searching'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label htmlFor="sort" className="text-sm font-medium text-slate-700">Sort by</label>
                  <select
                    id="sort"
                    value={sort}
                    onChange={(event) => handleSortChange(event.target.value)}
                    className="rounded-2xl border border-[#E5E7EB] bg-white py-3 px-4 pr-5.5 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/20"
                  >
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating_desc">Top Rated</option>
                  </select>
                </div>
              </div>

              <div ref={resultsRef} className="space-y-6">
                {isLoading ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="animate-pulse rounded-[28px] bg-white p-6 shadow-sm">
                        <div className="mb-4 h-44 rounded-3xl bg-slate-200" />
                        <div className="h-5 w-1/4 rounded-full bg-slate-200" />
                        <div className="mt-4 space-y-3">
                          <div className="h-4 rounded-full bg-slate-200" />
                          <div className="h-4 rounded-full bg-slate-200" />
                          <div className="h-10 rounded-full bg-slate-200" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="rounded-[28px] border border-[#F5C2C7] bg-[#FEF3F3] p-8 text-slate-900">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="h-6 w-6 text-[#B42318]" />
                      <div>
                        <h2 className="text-xl font-semibold text-[#9B1E1E]">Something went wrong</h2>
                        <p className="mt-2 text-sm text-slate-600">{error}</p>
                        <button
                          type="button"
                          onClick={() => performSearch(filters, currentPage, sort)}
                          className="mt-4 inline-flex rounded-2xl bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065E52]"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  </div>
                ) : !hasSearched ? (
                  <div className="rounded-[28px] bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E6F5F3] text-[#0A7C6E]">
                      <Search className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-[Playfair_Display] font-semibold text-[#1A1A2E]">Search for your perfect room</h2>
                    <p className="mt-3 text-sm text-slate-600">Use the filters on the left to find available rooms across our hotel collection.</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="rounded-[28px] bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                      <Search className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-[Playfair_Display] font-semibold text-[#1A1A2E]">No rooms found</h2>
                    <p className="mt-3 text-sm text-slate-600">Try adjusting your dates, location, or filters.</p>
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="mt-6 inline-flex rounded-2xl border border-[#0A7C6E] bg-white px-5 py-3 text-sm font-semibold text-[#0A7C6E] transition hover:bg-[#E6F5F3]"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {results.map((room) => (
                      <SearchResultCard key={room.roomId} room={room} checkIn={filters.checkIn} checkOut={filters.checkOut} />
                    ))}
                  </div>
                )}
              </div>

              {totalPages > 1 && !isLoading && !error && results.length > 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-2 rounded-[28px] bg-white px-4 py-4 shadow-sm">
                  <button
                    type="button"
                    onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  {pageButtons().map((pageIndex) => (
                    <button
                      key={pageIndex}
                      type="button"
                      onClick={() => handlePageChange(pageIndex)}
                      className={`h-11 min-w-[44px] rounded-2xl px-4 text-sm font-semibold transition ${
                        pageIndex === currentPage
                          ? 'bg-[#0A7C6E] text-white'
                          : 'border border-[#E5E7EB] bg-white text-slate-700 hover:border-[#0A7C6E]'
                      }`}
                    >
                      {pageIndex + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </main>

        {drawerOpen ? (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              aria-label="Close filters"
            />
            <div className="relative z-10 h-full w-[280px] bg-white p-5 shadow-2xl transition-transform duration-300 ease-out">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1A2E]">Filters</h2>
                  <p className="text-sm text-slate-500">Refine your search</p>
                </div>
                <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-full border border-[#E5E7EB] p-2 text-slate-600 transition hover:border-[#0A7C6E] hover:text-[#0A7C6E]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="overflow-y-auto pr-1">
                <FilterPanel filters={filters} onFilterChange={handleFilterChange} onClear={() => { handleClearFilters(); setDrawerOpen(false); }} />
              </div>
            </div>
          </div>
        ) : null}

      <Footer />
      </div>
  );
};

export default SearchPage;
