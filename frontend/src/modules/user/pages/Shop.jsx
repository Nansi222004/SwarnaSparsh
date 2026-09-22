import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useShop } from "../../../context/ShopContext";
import ProductCard from "../components/ProductCard";
import { getProductPrice, formatCurrency, getProductDiscountPercent } from "../utils/price";
import ProductSkeleton from "../components/ProductSkeleton";
import Loader from "../../shared/components/Loader";
import api from "../../../services/api";
import { usePublicProductsQuery } from "../hooks/usePublicProductsQuery";
import { matchesRequestedMetal, isUnrelatedProduct, matchesGoldTone, is925SilverProduct, matchesDiamondType, filterProductVariantsByDiamondType } from "../utils/productMetal";
import {
  Filter,
  ChevronDown,
  ShoppingBag,
  SlidersHorizontal,
  ArrowLeft,
  ArrowUpDown,
} from "lucide-react";
import HorizontalFilters from "../components/HorizontalFilters";
import CategoryHeroBanner from "../components/CategoryHeroBanner";
import { useRef } from "react";

const useDragScroll = () => {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const onMouseDown = (e) => {
    if (!ref.current) return;
    if (
      e.target.tagName === "BUTTON" ||
      e.target.tagName === "INPUT" ||
      e.target.tagName === "SELECT" ||
      e.target.closest("button")
    )
      return;
    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setStartY(e.pageY - ref.current.offsetTop);
    setScrollLeft(ref.current.scrollLeft);
    setScrollTop(ref.current.scrollTop);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const y = e.pageY - ref.current.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    ref.current.scrollLeft = scrollLeft - walkX;
    ref.current.scrollTop = scrollTop - walkY;
  };

  return {
    ref,
    events: {
      onMouseDown,
      onMouseLeave,
      onMouseUp,
      onMouseMove,
    },
    isDragging,
  };
};

// Local currency utility removed in favor of centralized price utility

const stableKeyFromParams = (params) => {
  const entries = Object.entries(params || {})
    .filter(([, v]) => v !== undefined && v !== null && String(v) !== "")
    .map(([k, v]) => [k, String(v)]);
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  return entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
};

const Shop = () => {
  const { products, categories, isLoading } = useShop();
  const visibleCategories = categories.filter(
    (cat) =>
      cat.isActive !== false &&
      cat.showInCollection !== false &&
      !/oxidi|oxydis/i.test(cat.name || "") &&
      !/oxidi|oxydis/i.test(cat.slug || "") &&
      !/^malas?$/i.test(cat.slug || "") &&
      !/^malas?$/i.test(cat.name || ""),
  );
  const location = useLocation();
  const navigate = useNavigate();
  const { category } = useParams();

  const normalizeCategoryToken = (value) => {
    // Accept ids, slugs, or legacy values like "/category/rings" and normalize to "rings".
    let token = String(value || "").trim();
    if (!token) return "";
    try {
      token = decodeURIComponent(token);
    } catch {
      // ignore
    }
    token = token.replace(/^\/+/, "");
    if (token.toLowerCase().startsWith("category/")) {
      token = token.slice("category/".length);
    }
    return token.trim();
  };

  const activeCategoryHint = useMemo(() => {
    const qp = new URLSearchParams(location.search);
    const fromQuery = normalizeCategoryToken(qp.get("category") || "");
    if (fromQuery) return fromQuery;

    const categorySlugParam = String(category || "").trim();
    const isAudienceSlug = ["men", "women", "family"].includes(
      categorySlugParam.toLowerCase(),
    );
    if (!isAudienceSlug && categorySlugParam)
      return normalizeCategoryToken(categorySlugParam);

    return "";
  }, [location.search, category]);

  const activeCategory = useMemo(() => {
    if (!activeCategoryHint) return null;
    if (!Array.isArray(categories) || categories.length === 0) return null;

    const raw = String(activeCategoryHint).trim();
    // 1. Direct ID match
    const byId = categories.find((c) => String(c?._id || c?.id) === raw);
    if (byId) return byId;

    const lowered = raw.toLowerCase();
    // 2. Slug match (case-insensitive)
    const bySlug = categories.find(
      (c) => String(c?.slug || "").toLowerCase() === lowered,
    );
    if (bySlug) return bySlug;

    // 3. Path match
    const byPath = categories.find(
      (c) => normalizeCategoryToken(c?.path || "").toLowerCase() === lowered,
    );
    if (byPath) return byPath;

    // 4. Name match (case-insensitive)
    const byName = categories.find(
      (c) => String(c?.name || "").toLowerCase() === lowered,
    );
    if (byName) return byName;

    // 5. Slugified name or slug match (e.g. "toe-rings" <-> "Toe Rings")
    const slugify = (str) =>
      String(str || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const rawSlugified = slugify(raw);
    const bySlugified = categories.find(
      (c) =>
        slugify(c?.name) === rawSlugified ||
        slugify(c?.slug) === rawSlugified,
    );
    return bySlugified || null;
  }, [activeCategoryHint, categories]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(
    () => activeCategory?.name || "All",
  );
  const [filterNewArrivals, setFilterNewArrivals] = useState(false);
  const [filterTrending, setFilterTrending] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isWebSortOpen, setIsWebSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState("New Arrival");
  const [priceRange, setPriceRange] = useState(50000);
  const [filteredProducts, setFilteredProducts] = useState(products || []);
  const [pageTitle, setPageTitle] = useState("All Jewellery");
  const sidebarScroll = useDragScroll();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 50) {
        setIsNavVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const queryParams = new URLSearchParams(location.search);
  const isComingSoonQuery = queryParams.get("status") === "coming-soon";
  const sourceQuery = queryParams.get("source");
  const priceMaxQuery = queryParams.get("price_max"); // upper bound — e.g. price_max=3000
  const priceMinQuery = queryParams.get("price_min"); // lower bound — e.g. price_min=1500
  const productsQuery = queryParams.get("products");
  const limitQuery = queryParams.get("limit");
  const sortQuery = queryParams.get("sort");
  const searchQuery = queryParams.get("search");
  const karatQuery = queryParams.get("karat");
  const silverTypeQuery = queryParams.get("silver_type");
  // Backwards compatibility for older links (e.g. All Type mega menu used `purity`)
  const purityQuery = queryParams.get("purity");
  const toneQuery = queryParams.get("tone") || queryParams.get("settingMetal");
  const stoneQuery = queryParams.get("stone");
  const diamondTypeQuery = queryParams.get("diamondType");
  const availabilityQuery = queryParams.get("availability");
  const inStockQuery = queryParams.get("inStock");
  const isMenFlow = sourceQuery === "men";
  const isWomenFlow = sourceQuery === "women";

  const [pinnedProducts, setPinnedProducts] = useState([]);
  const [isPinnedLoading, setIsPinnedLoading] = useState(false);

  const requestedPinnedIds = useMemo(() => {
    if (!productsQuery) return [];
    return String(productsQuery)
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }, [productsQuery]);

  useEffect(() => {
    const loadPinned = async () => {
      if (!productsQuery) {
        setPinnedProducts([]);
        return;
      }

      const validIds = requestedPinnedIds.filter((id) =>
        /^[a-f\\d]{24}$/i.test(id),
      );
      if (validIds.length === 0) {
        setPinnedProducts([]);
        return;
      }

      setIsPinnedLoading(true);
      try {
        const res = await api.get("public/products/by-ids", {
          params: {
            ids: validIds.join(","),
            // Pinned CMS should not silently disappear if stock is 0.
            inStockOnly: false,
          },
        });
        const list = res?.data?.data?.products || [];
        setPinnedProducts(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Failed to fetch pinned products:", err);
        setPinnedProducts([]);
      } finally {
        setIsPinnedLoading(false);
      }
    };

    loadPinned();
  }, [productsQuery, requestedPinnedIds]);

  const serverQueryParams = useMemo(() => {
    if (productsQuery) return null; // pinned-products mode uses /by-ids

    const qp = new URLSearchParams(location.search);
    const metal = qp.get("metal");
    const effectiveKarat = karatQuery || purityQuery || "";
    const effectiveCategory = normalizeCategoryToken(qp.get("category") || "");
    const categorySlugParam = String(category || "").trim();
    const isAudienceSlug = ["men", "women", "family"].includes(
      categorySlugParam.toLowerCase(),
    );
    const categoryParam =
      effectiveCategory ||
      (!isAudienceSlug ? normalizeCategoryToken(categorySlugParam) : "");
    const resolvedCategoryParam =
      activeCategory?._id ||
      categoryParam;

    const isNewArrivalsRoute = location.pathname.includes("/new-arrivals");
    const isTrendingRoute = location.pathname.includes("/trending");
    const explicitTags = qp.get("tags");
    const resolvedTags =
      explicitTags ||
      (isNewArrivalsRoute ? "isNewArrival" : "") ||
      (isTrendingRoute ? "isTrending" : "");

    const audienceParam = ["men", "women", "family"].includes(
      String(sourceQuery || "").toLowerCase(),
    )
      ? String(sourceQuery || "").toLowerCase()
      : "";

    const sortParam = sortQuery || "";

    const priceMin =
      priceMinQuery || qp.get("minPrice") || qp.get("priceMin") || "";
    const priceMax =
      priceMaxQuery || qp.get("maxPrice") || qp.get("priceMax") || "";

    const resolvedLimit =
      Number(String(limitQuery || "").replace(/[^0-9]/g, "")) || 60;
    const resolvedPage =
      Number(String(qp.get("page") || "").replace(/[^0-9]/g, "")) || 1;
    const purityParam = purityQuery || karatQuery || silverTypeQuery || "";
    const stoneParam = stoneQuery || diamondTypeQuery || "";
    const availabilityParam =
      availabilityQuery ||
      (inStockQuery === "false"
        ? "all"
        : inStockQuery === "true"
          ? "in_stock"
          : "");

    const inStockOnly =
      availabilityParam === "all" || availabilityParam === "out_of_stock"
        ? false
        : true;

    return {
      ...(searchQuery ? { search: searchQuery } : {}),
      ...(resolvedCategoryParam ? { category: resolvedCategoryParam } : {}),
      ...(metal ? { metal } : {}),
      ...(toneQuery ? { tone: toneQuery } : {}),
      ...(purityParam ? { purity: purityParam } : {}),
      ...(effectiveKarat ? { karat: effectiveKarat } : {}),
      ...(silverTypeQuery ? { silver_type: silverTypeQuery } : {}),
      ...(stoneParam ? { stone: stoneParam } : {}),
      ...(availabilityParam ? { availability: availabilityParam } : {}),
      ...(resolvedTags ? { tags: resolvedTags } : {}),
      ...(audienceParam ? { audience: audienceParam } : {}),
      ...(sortParam ? { sort: sortParam } : {}),
      ...(priceMin ? { price_min: priceMin } : {}),
      ...(priceMax ? { price_max: priceMax } : {}),
      inStockOnly,
      page: resolvedPage,
      limit: resolvedLimit,
    };
  }, [
    productsQuery,
    location.search,
    category,
    activeCategory,
    karatQuery,
    purityQuery,
    silverTypeQuery,
    stoneQuery,
    diamondTypeQuery,
    availabilityQuery,
    inStockQuery,
    sourceQuery,
    sortQuery,
    searchQuery,
    priceMinQuery,
    priceMaxQuery,
    limitQuery,
    location.pathname,
    toneQuery,
  ]);

  const {
    data: serverProductsPayload,
    isLoading: isServerProductsLoading,
    isError: isServerProductsError,
    error: serverProductsError,
    refetch: refetchServerProducts,
  } = usePublicProductsQuery(serverQueryParams || {}, {
    enabled: Boolean(serverQueryParams),
  });

  const serverProducts = serverProductsPayload?.products || [];
  const canUseServerProducts =
    Boolean(serverQueryParams) &&
    !isServerProductsLoading &&
    !isServerProductsError;
  const serverPagination = serverProductsPayload?.pagination || null;
  const serverModeEnabled = Boolean(serverQueryParams) && !productsQuery;
  const currentServerPage =
    Number(String(queryParams.get("page") || "1").replace(/[^0-9]/g, "")) || 1;
  const [serverAccumulatedProducts, setServerAccumulatedProducts] = useState(
    [],
  );

  const serverFilterKey = useMemo(() => {
    if (!serverQueryParams) return "";
    const { page: _page, ...rest } = serverQueryParams;
    return stableKeyFromParams(rest);
  }, [serverQueryParams]);

  useEffect(() => {
    if (!serverModeEnabled) return;
    setServerAccumulatedProducts([]);
    if (currentServerPage !== 1) {
      updateShopQuery({ page: 1 });
    }
    // Intentionally ignore updateShopQuery in deps to avoid loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverFilterKey, serverModeEnabled]);

  useEffect(() => {
    if (!serverModeEnabled) return;
    if (!canUseServerProducts) return;

    setServerAccumulatedProducts((prev) => {
      const incoming = Array.isArray(serverProducts) ? serverProducts : [];
      if (currentServerPage <= 1) return incoming;

      const map = new Map(
        (prev || []).map((p) => [String(p?.id || p?._id), p]),
      );
      incoming.forEach((p) => {
        const key = String(p?.id || p?._id);
        if (key && !map.has(key)) map.set(key, p);
      });
      return Array.from(map.values());
    });
  }, [
    serverModeEnabled,
    canUseServerProducts,
    serverProducts,
    currentServerPage,
  ]);

  const productsToRender = useMemo(() => {
    let list = [];
    if (productsQuery) list = pinnedProducts;
    else if (serverModeEnabled) {
      list = serverAccumulatedProducts.length > 0 ? serverAccumulatedProducts : serverProducts;
    } else {
      list = filteredProducts;
    }

    const qp = new URLSearchParams(location.search);
    const isExplicitMala = Boolean(
      qp.get("category") === "malas" ||
      category === "malas" ||
      activeCategory?.slug === "malas" ||
      selectedCategory === "Malas" ||
      /\bmala\b/i.test(qp.get("search") || "")
    );

    if (!isExplicitMala && Array.isArray(list)) {
      return list.filter((p) => {
        const cat = String(p.categorySlug || p.category || "").toLowerCase();
        const name = String(p.name || "").toLowerCase();
        if (cat === "malas" || cat === "mala") return false;
        if (/\bmala(\s*set)?\b/i.test(name)) return false;
        return true;
      });
    }

    return list;
  }, [
    productsQuery,
    pinnedProducts,
    serverModeEnabled,
    serverAccumulatedProducts,
    serverProducts,
    filteredProducts,
    location.search,
    category,
    activeCategory,
    selectedCategory,
  ]);

  useEffect(() => {
    // Use a local flag to avoid multiple updates in the same cycle
    let isCancelled = false;

    const parsedPrice = Number(
      String(priceMaxQuery || "").replace(/[^0-9]/g, ""),
    );

    // Synchronize selectedCategory with the URL/route category
    if (activeCategory) {
      if (selectedCategory !== activeCategory.name) {
        if (!isCancelled) setSelectedCategory(activeCategory.name);
      }
    } else if (activeCategoryHint) {
      // activeCategoryHint is present, check if category can be matched
      const matched = (categories || []).find((c) => {
        const raw = String(activeCategoryHint).trim().toLowerCase();
        return (
          String(c?._id || c?.id) === activeCategoryHint ||
          String(c?.slug || "").toLowerCase() === raw ||
          String(c?.name || "").toLowerCase() === raw
        );
      });
      if (matched && selectedCategory !== matched.name) {
        if (!isCancelled) setSelectedCategory(matched.name);
      } else if (!matched && categories && categories.length > 0 && selectedCategory !== "All") {
        if (!isCancelled) setSelectedCategory("All");
      }
    } else if (selectedCategory !== "All") {
      if (!isCancelled) setSelectedCategory("All");
    }

    const isNewArrivals = location.pathname === "/new-arrivals";
    if (filterNewArrivals !== isNewArrivals) {
      if (!isCancelled) setFilterNewArrivals(isNewArrivals);
    }

    const isTrending = location.pathname === "/trending";
    if (filterTrending !== isTrending) {
      if (!isCancelled) setFilterTrending(isTrending);
    }

    if (sortQuery === "most-sold" && sortBy !== "Best Selling") {
      if (!isCancelled) setSortBy("Best Selling");
    } else if ((sortQuery === "latest" || sortQuery === "newest") && sortBy !== "New Arrival") {
      if (!isCancelled) setSortBy("New Arrival");
    } else if (sortQuery === "discount" && sortBy !== "Discount") {
      if (!isCancelled) setSortBy("Discount");
    }

    if (Number.isFinite(parsedPrice) && parsedPrice > 0) {
      if (priceRange !== parsedPrice) {
        if (!isCancelled) setPriceRange(parsedPrice);
      }
    } else if (priceRange !== 50000) {
      if (!isCancelled) setPriceRange(50000);
    }

    return () => {
      isCancelled = true;
    };
  }, [
    location.search,
    location.pathname,
    category,
    activeCategory,
    activeCategoryHint,
    categories,
    selectedCategory,
    filterNewArrivals,
    filterTrending,
    sortBy,
    priceRange,
  ]);

  useEffect(() => {
    if (isFilterOpen || isSortOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFilterOpen, isSortOpen]);

  const normalizeAudience = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();
  const getProductAudience = (product) => {
    const list = Array.isArray(product?.audience) ? product.audience : [];
    if (list.length === 0) return ["unisex"];
    return list.map(normalizeAudience).filter(Boolean);
  };
  const matchesAudienceScope = (product) => {
    if (!isMenFlow && !isWomenFlow) return true;
    const audience = getProductAudience(product);
    if (audience.includes("unisex")) return true;
    if (isMenFlow) return audience.includes("men");
    if (isWomenFlow) return audience.includes("women");
    return true;
  };

  const updateShopQuery = (updates = {}, pathOverride = location.pathname) => {
    const params = new URLSearchParams(location.search);

    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === false ||
        value === "All"
      ) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    const nextSearch = params.toString();
    navigate(`${pathOverride}${nextSearch ? `?${nextSearch}` : ""}`, {
      replace: true,
    });
  };

  // Effect to handle URL-based Logic + Local Category Filter
  useEffect(() => {
    const path = location.pathname;
    const categoryQuery = queryParams.get("category");
    const metalQuery = queryParams.get("metal");

    let baseProducts = products;
    let title = "All Jewellery";

    // Use centralized price utility
    const getProductCreatedAt = (product) => {
      const ts = product?.createdAt || product?.updatedAt || "";
      const date = ts ? new Date(ts).getTime() : 0;
      if (date) return date;
      const id = String(product?._id || product?.id || "");
      return id ? parseInt(id.substring(0, 8), 16) || 0 : 0;
    };
    const getProductSold = (product) => {
      if (!product) return 0;
      if (Number.isFinite(product.sold)) return product.sold;
      const variantSold = (product.variants || []).reduce(
        (sum, v) => sum + (v.sold || 0),
        0,
      );
      return Number.isFinite(variantSold) ? variantSold : 0;
    };
    const shuffleArray = (arr) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const categoryQueryObj = categoryQuery
      ? categories.find(
        (c) =>
          c._id === categoryQuery ||
          c.id === categoryQuery ||
          c.name === categoryQuery ||
          c.slug === categoryQuery ||
          c.path === categoryQuery,
      ) || null
      : null;

    const matchesCategory = (product, value, cat) => {
      if (!value && !cat) return true;
      const valueStr = value ? String(value) : "";
      const valueLower = valueStr.toLowerCase();
      const productCategory = product.category || "";
      const productCategorySlug = product.categorySlug || "";
      const productCategoryId = product.categoryId || product.category_id || "";
      const catId = cat?._id || cat?.id || "";
      const catName = cat?.name || "";
      const catSlug = cat?.path || cat?.slug || "";
      const navCategoryIds = (product.navShopByCategory || []).map((id) =>
        String(id),
      );

      if (
        productCategoryId &&
        valueStr &&
        String(productCategoryId) === valueStr
      )
        return true;
      if (
        productCategoryId &&
        catId &&
        String(productCategoryId) === String(catId)
      )
        return true;
      if (valueStr && navCategoryIds.includes(valueStr)) return true;
      if (catId && navCategoryIds.includes(String(catId))) return true;
      if (
        productCategory &&
        valueLower &&
        productCategory.toLowerCase() === valueLower
      )
        return true;
      if (
        productCategorySlug &&
        valueLower &&
        productCategorySlug.toLowerCase() === valueLower
      )
        return true;
      if (productCategory && catName && productCategory === catName)
        return true;
      if (
        productCategory &&
        catSlug &&
        productCategory.toLowerCase() === catSlug.toLowerCase()
      )
        return true;
      if (
        productCategorySlug &&
        catSlug &&
        productCategorySlug.toLowerCase() === catSlug.toLowerCase()
      )
        return true;

      return false;
    };
    const getProductMetal = (product) => {
      const material = String(product?.material || "").trim();
      if (material) return material;
      return product.metal;
    };
    const normalizeSilverTier = (value) => {
      const normalized = String(value || "")
        .trim()
        .toLowerCase();
      if (!normalized) return null;
      if (
        normalized === "925" ||
        normalized.startsWith("925 ") ||
        normalized.includes("sterling")
      )
        return "sterling";
      if (normalized.includes("fine")) return "fine";
      // Treat all other silver categories (800/835/958/970/990/999 etc) as fine for filtering.
      return "fine";
    };
    const normalizeGoldKarat = (value) => {
      const normalized = String(value || "")
        .trim()
        .toLowerCase();
      if (!normalized) return null;
      // Accept: "24", "24k", "24 k", etc.
      const digits = normalized.replace(/[^0-9]/g, "");
      return digits || null;
    };

    const effectiveKarat = normalizeGoldKarat(
      karatQuery ||
      (purityQuery && String(purityQuery).toLowerCase().includes("k")
        ? purityQuery
        : ""),
    );
    const effectiveSilverType = (() => {
      if (silverTypeQuery) return normalizeSilverTier(silverTypeQuery);
      if (!purityQuery) return null;
      const normalized = String(purityQuery).trim().toLowerCase();
      if (normalized === "925" || normalized.includes("sterling"))
        return "sterling";
      if (normalized.includes("fine") || normalized === "999") return "fine";
      if (normalized === "800") return "800";
      return null;
    })();

    const matchesPurityTier = (product) => {
      const activePurity = purityQuery || effectiveKarat || effectiveSilverType;
      if (!activePurity) return true;
      const pLow = String(activePurity).toLowerCase();

      if (metalQuery?.toLowerCase() === "gold") {
        const num = pLow.replace(/[^0-9]/g, "");
        if (num) {
          return String(product.goldCategory || "").includes(num) || String(product.settingPurity || "").includes(num);
        }
        return String(product.goldCategory || "").toLowerCase().includes(pLow);
      }
      if (metalQuery?.toLowerCase() === "silver") {
        const productTier = normalizeSilverTier(product.silverCategory) || "fine";
        const silverCat = String(product.silverCategory || "").toLowerCase();
        if (pLow === "925" || pLow.includes("sterling")) {
          return is925SilverProduct(product) || productTier === "sterling" || silverCat.includes("925");
        }
        if (pLow === "fine" || pLow.includes("999")) {
          return productTier !== "sterling" || silverCat.includes("999") || silverCat.includes("fine");
        }
        if (pLow === "800") {
          return silverCat.includes("800") || silverCat.includes("835");
        }
        return silverCat.includes(pLow);
      }
      if (metalQuery?.toLowerCase() === "diamond") {
        const settingP = String(product.settingPurity || "").toLowerCase();
        const num = pLow.replace(/[^0-9]/g, "");
        if (num) return settingP.includes(num);
        return settingP.includes(pLow);
      }
      return true;
    };

    // 1. Determine Base Products & Title from URL
    if (path === "/new-arrivals") {
      title = "New Arrivals";
      baseProducts = products.filter((p) => p.isNew);
    } else if (path === "/trending") {
      title = "Trending Now";
      baseProducts = products.filter((p) => p.rating >= 4.5);
    } else if (metalQuery) {
      const normalizedMetal = metalQuery.toLowerCase();
      title = `${metalQuery.charAt(0).toUpperCase() + metalQuery.slice(1)} Collection`;
      baseProducts = products.filter((p) => {
        if (isUnrelatedProduct(p)) return false;
        return matchesRequestedMetal(p, normalizedMetal);
      });
      if (normalizedMetal === "diamond") {
        const dLow = String(diamondTypeQuery || "").toLowerCase();
        if (dLow === "natural") {
          title = "Natural Diamonds Collection";
        } else if (dLow === "lab_grown" || dLow === "lab-grown") {
          title = "Lab-Grown Diamonds Collection";
        } else {
          title = "Diamond Jewellery Collection";
        }
      } else if (normalizedMetal === "gold" && toneQuery) {
        const tLow = toneQuery.toLowerCase();
        if (tLow.includes("white")) {
          title = "White Gold Collection";
        } else if (tLow.includes("rose")) {
          title = "Rose Gold Collection";
        } else {
          title = "Gold Collection";
        }
      } else if (normalizedMetal === "gold" && effectiveKarat) {
        title = `${effectiveKarat}K Gold`;
      } else if (
        normalizedMetal === "silver" &&
        effectiveSilverType
      ) {
        title =
          effectiveSilverType === "sterling"
            ? "925 Sterling Silver"
            : "Fine Silver";
      }
    } else if (activeCategory || category) {
      const currentCat =
        activeCategory ||
        categories.find(
          (c) =>
            c.path === category ||
            c.slug === category ||
            String(c.slug || "").toLowerCase() ===
              String(category || "").toLowerCase() ||
            String(c.name || "").toLowerCase() ===
              String(category || "").toLowerCase(),
        );
      title = currentCat
        ? currentCat.name
        : category
          ? category.charAt(0).toUpperCase() + category.slice(1)
          : title;
      baseProducts = products.filter((p) =>
        matchesCategory(
          p,
          category || currentCat?.slug || currentCat?._id,
          currentCat,
        ),
      );
    }

    baseProducts = baseProducts.filter((p) => !isUnrelatedProduct(p));

    const isMalaExplicitContext = Boolean(
      categoryQuery === "malas" ||
      category === "malas" ||
      activeCategory?.slug === "malas" ||
      selectedCategory === "Malas" ||
      /\bmala\b/i.test(searchQuery || "")
    );
    if (!isMalaExplicitContext) {
      baseProducts = baseProducts.filter((p) => {
        const cat = String(p.categorySlug || p.category || "").toLowerCase();
        const name = String(p.name || "").toLowerCase();
        if (cat === "malas" || cat === "mala") return false;
        if (/\bmala(\s*set)?\b/i.test(name)) return false;
        return true;
      });
    }

    if (metalQuery?.toLowerCase() === "gold" && toneQuery) {
      baseProducts = baseProducts.filter((p) => matchesGoldTone(p, toneQuery));
    }

    if (diamondTypeQuery) {
      baseProducts = baseProducts
        .filter((p) => matchesDiamondType(p, diamondTypeQuery))
        .map((p) => filterProductVariantsByDiamondType(p, diamondTypeQuery));
    }

    if (metalQuery && (effectiveKarat || effectiveSilverType || purityQuery)) {
      baseProducts = baseProducts.filter(matchesPurityTier);
    }

    if (categoryQuery) {
      baseProducts = baseProducts.filter((p) =>
        matchesCategory(p, categoryQuery, categoryQueryObj),
      );
      if (!title || title === "All Jewellery" || title === "Men's Jewellery" || title === "Women's Jewellery") {
        let prefix = "";
        if (isMenFlow) prefix = "Men's ";
        else if (isWomenFlow) prefix = "Women's ";
        const catName = categoryQueryObj ? categoryQueryObj.name : categoryQuery.charAt(0).toUpperCase() + categoryQuery.slice(1);
        title = `${prefix}${catName}`;
      }
    }

    if (priceMaxQuery && priceMinQuery) {
      const parsedMin = Number(String(priceMinQuery).replace(/[^0-9]/g, ""));
      const parsedMax = Number(String(priceMaxQuery).replace(/[^0-9]/g, ""));
      title = `₹${parsedMin.toLocaleString("en-IN")} – ₹${parsedMax.toLocaleString("en-IN")}`;
    } else if (priceMaxQuery) {
      const parsedPrice = Number(String(priceMaxQuery).replace(/[^0-9]/g, ""));
      title = `Under ₹${parsedPrice.toLocaleString("en-IN")}`;
    } else if (priceMinQuery) {
      const parsedMin = Number(String(priceMinQuery).replace(/[^0-9]/g, ""));
      title = `Above ₹${parsedMin.toLocaleString("en-IN")}`;
    }
    if (productsQuery) {
      if (pinnedProducts.length > 0) {
        baseProducts = pinnedProducts;
        title = "Perfect Gift";
      } else {
        const ids = String(productsQuery)
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
        if (ids.length > 0) {
          baseProducts = baseProducts.filter((p) =>
            ids.includes(String(p._id || p.id)),
          );
          title = "Perfect Gift";
        }
      }
    }
    if (sortQuery === "latest") {
      title = selectedCategory !== "All" ? selectedCategory : "Latest Drop";
    }
    if (sortQuery === "most-sold") {
      title = selectedCategory !== "All" ? selectedCategory : "Most Gifted";
    }
    if (sortQuery === "random") {
      title = selectedCategory !== "All" ? selectedCategory : "Curated For You";
    }
    if (searchQuery) {
      title = `Search: ${searchQuery}`;
    }

    // Apply Title overrides from Local Filters
    if (selectedCategory !== "All") {
      title = selectedCategory;
    } else if (filterNewArrivals && path === "/shop") {
      title = "Just Arrived";
    } else if (filterTrending && path === "/shop") {
      title = "Trending Now";
    }

    if (pageTitle !== title) {
      setPageTitle(title);
    }

    if (canUseServerProducts) {
      // Only update if the length or first item changed (simple stability check)
      if (
        filteredProducts.length !== serverProducts.length ||
        filteredProducts[0]?.id !== serverProducts[0]?.id
      ) {
        setFilteredProducts(serverProducts);
      }
      return;
    }

    let result = baseProducts;

    // Enforce men/women audience scope when coming from those landing pages.
    result = result.filter(matchesAudienceScope);

    // 2. Apply Local Category Filter (if selected)
    if (selectedCategory !== "All") {
      const selectedCat =
        activeCategory ||
        categories.find(
          (c) =>
            c.name === selectedCategory ||
            c.slug === selectedCategory ||
            c.path === selectedCategory,
        );
      result = result.filter((p) =>
        matchesCategory(p, selectedCategory, selectedCat),
      );
    }

    if (searchQuery) {
      const normalizedSearch = String(searchQuery).trim().toLowerCase();
      result = result.filter((product) => {
        const haystack = [
          product.name,
          product.description,
          product.shortDescription,
          product.category,
          product.categorySlug,
          product.settingMetal,
          product.material,
          ...(product.tags || []),
          ...(product.variants || []).map((variant) => variant.name),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      });
    }

    // 2.2 Apply Collection Filters
    if (filterNewArrivals) {
      result = result.filter((p) => p.isNew);
    }
    if (filterTrending) {
      result = result.filter((p) => p.rating >= 4.5);
    }

    // 3. Apply Price Filter
    // URL-driven range filters (price_min / price_max) take priority over slider
    const urlPriceMax = priceMaxQuery
      ? Number(String(priceMaxQuery).replace(/[^0-9]/g, ""))
      : null;
    const urlPriceMin = priceMinQuery
      ? Number(String(priceMinQuery).replace(/[^0-9]/g, ""))
      : null;

    if (urlPriceMax && Number.isFinite(urlPriceMax) && urlPriceMax > 0) {
      result = result.filter((p) => getProductPrice(p) <= urlPriceMax);
    } else {
      // Fall back to local slider state
      result = result.filter((p) => getProductPrice(p) <= priceRange);
    }
    if (urlPriceMin && Number.isFinite(urlPriceMin) && urlPriceMin > 0) {
      result = result.filter((p) => getProductPrice(p) >= urlPriceMin);
    }

    // 3.1 Apply Stone Filter (Fallback mode)
    if (stoneQuery) {
      const sLow = String(stoneQuery).toLowerCase();
      result = result.filter((p) => {
        const dType = String(p.diamondType || "none").toLowerCase();
        const title = String(p.name || "").toLowerCase();
        const desc = String(p.description || "").toLowerCase();
        const mat = String(p.material || "").toLowerCase();
        const isAD =
          /\b(ad|american diamond)\b/i.test(title) ||
          /\b(ad|american diamond)\b/i.test(desc);
        const isKundanOrPearl =
          mat.includes("kundan") ||
          mat.includes("pearl") ||
          /\b(moti|pearl|kundan)\b/i.test(title);

        if (sLow === "none") return dType === "none" && !isAD && !isKundanOrPearl;
        if (sLow === "ad") return isAD;
        if (sLow === "natural") return dType === "natural";
        if (sLow === "lab_grown" || sLow === "lab-grown" || sLow === "lab grown")
          return dType === "lab_grown";
        if (sLow === "pearl_kundan" || sLow === "pearls_kundan" || sLow === "pearl")
          return isKundanOrPearl;
        return true;
      });
    }

    // 3.2 Apply Availability Filter (Fallback mode)
    const effectiveAvailability =
      availabilityQuery ||
      (inStockQuery === "false"
        ? "all"
        : inStockQuery === "true"
          ? "in_stock"
          : "");
    if (effectiveAvailability === "in_stock") {
      result = result.filter((p) => {
        const variantStock = (p.variants || []).reduce(
          (acc, v) => acc + (Number(v.stock) || 0),
          0,
        );
        return p.variants && p.variants.length > 0
          ? variantStock > 0
          : Number(p.stock || 0) > 0;
      });
    } else if (effectiveAvailability === "out_of_stock") {
      result = result.filter((p) => {
        const variantStock = (p.variants || []).reduce(
          (acc, v) => acc + (Number(v.stock) || 0),
          0,
        );
        return p.variants && p.variants.length > 0
          ? variantStock <= 0
          : Number(p.stock || 0) <= 0;
      });
    }

    // 4. Apply Sorting
    if (sortQuery === "discount" || sortBy === "Discount") {
      result.sort((a, b) => getProductDiscountPercent(b) - getProductDiscountPercent(a));
    } else if (sortQuery === "most-sold" || sortBy === "Best Selling") {
      result.sort((a, b) => (getProductSold(b) - getProductSold(a)) || ((b.rating || 0) - (a.rating || 0)));
    } else if (sortQuery === "random") {
      result = shuffleArray(result);
    } else {
      // Default: New Arrival ("New Arrival" / "Newest" / "latest")
      result.sort((a, b) => {
        const dateDiff = getProductCreatedAt(b) - getProductCreatedAt(a);
        if (dateDiff !== 0) return dateDiff;
        if (Boolean(b.isNew) !== Boolean(a.isNew)) return b.isNew ? 1 : -1;
        return 0;
      });
    }

    // 5. Apply Limit (query)
    if (limitQuery) {
      const parsedLimit = Number(String(limitQuery).replace(/[^0-9]/g, ""));
      if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
        result = result.slice(0, parsedLimit);
      }
    }

    // Only update filteredProducts if the results have actually changed
    const hasChanged =
      result.length !== filteredProducts.length ||
      (result.length > 0 && result[0]?.id !== filteredProducts[0]?.id);

    if (hasChanged) {
      setFilteredProducts(result);
    }
  }, [
    location,
    category,
    selectedCategory,
    activeCategory,
    priceRange,
    filterNewArrivals,
    filterTrending,
    sortBy,
    categories,
    products,
    canUseServerProducts,
    serverProducts,
    productsQuery,
    purityQuery,
    stoneQuery,
    availabilityQuery,
    inStockQuery,
  ]);

  useEffect(() => {
    const metal = String(queryParams.get("metal") || "")
      .trim()
      .toLowerCase();
    const suffix =
      metal === "gold"
        ? "Gold Jewellery"
        : metal === "silver"
          ? "Silver Jewellery"
          : metal === "diamond"
            ? "Diamond Jewellery"
            : "Jewellery";
    document.title = `${pageTitle} | Alankar Jewellers - ${suffix}`;
  }, [pageTitle]);

  // Handle Category Change
  const handleCategoryChange = (val) => {
    if (val === "All") {
      setSelectedCategory("All");
      const params = new URLSearchParams(location.search);
      params.delete("category");
      params.delete("page");
      const qs = params.toString();
      navigate(`/shop${qs ? `?${qs}` : ""}`);
      return;
    }

    const selectedCat = categories.find(
      (cat) =>
        cat.name === val ||
        cat.slug === val ||
        String(cat._id || cat.id) === val,
    );
    const targetName = selectedCat?.name || val;
    setSelectedCategory(targetName);

    const slug =
      selectedCat?.slug ||
      normalizeCategoryToken(selectedCat?.path || "") ||
      (selectedCat?._id ? null : normalizeCategoryToken(val));

    const params = new URLSearchParams(location.search);
    params.delete("category");
    params.delete("page");
    params.delete("search");
    const qs = params.toString();

    if (slug) {
      navigate(`/category/${encodeURIComponent(slug)}${qs ? `?${qs}` : ""}`);
    } else {
      const catId = selectedCat?._id || selectedCat?.id || val;
      params.set("category", String(catId));
      navigate(`/shop?${params.toString()}`);
    }
  };

  const handleSortChange = (option) => {
    setSortBy(option);
    const sortMap = {
      "New Arrival": "latest",
      Newest: "latest",
      Discount: "discount",
      "Best Selling": "most-sold",
    };
    updateShopQuery({ sort: sortMap[option] || null });
  };

  const handlePriceRangeChange = (value) => {
    const nextValue = Number(value);
    setPriceRange(nextValue);
    updateShopQuery({ price_max: nextValue >= 50000 ? null : nextValue });
  };

  const handleCollectionToggle = (type, checked) => {
    if (type === "new-arrivals") {
      if (checked) {
        setFilterNewArrivals(true);
        setFilterTrending(false);
        navigate(`/new-arrivals${location.search || ""}`, { replace: true });
      } else {
        setFilterNewArrivals(false);
        navigate(`/shop${location.search || ""}`, { replace: true });
      }
      return;
    }

    if (type === "trending") {
      if (checked) {
        setFilterTrending(true);
        setFilterNewArrivals(false);
        navigate(`/trending${location.search || ""}`, { replace: true });
      } else {
        setFilterTrending(false);
        navigate(`/shop${location.search || ""}`, { replace: true });
      }
    }
  };

  const handleAudienceChange = (val) => {
    updateShopQuery({ source: val === "all" ? null : val });
  };

  const handleMetalChange = (val) => {
    updateShopQuery({
      metal: val === "All" ? null : val.toLowerCase(),
      karat: null,
      silver_type: null,
      purity: null,
    });
  };

  const handlePurityChange = (val) => {
    updateShopQuery({
      purity: val === "All" ? null : val,
      karat: null,
      silver_type: null,
    });
  };

  const handleStonesChange = (val) => {
    updateShopQuery({
      stone: val === "All" ? null : val,
      diamondType: null,
    });
  };

  const handleAvailabilityChange = (val) => {
    updateShopQuery({
      availability: val === "All" ? null : val,
      inStock: null,
    });
  };

  const handleDiamondTypeChange = (val) => {
    updateShopQuery({ diamondType: val === "All" ? null : val });
  };

  const handleTagsChange = (val) => {
    const currentTags =
      queryParams.get("tags")?.split(",").filter(Boolean) || [];
    let nextTags;
    if (currentTags.includes(val)) {
      nextTags = currentTags.filter((t) => t !== val);
    } else {
      nextTags = [...currentTags, val];
    }
    updateShopQuery({ tags: nextTags.length > 0 ? nextTags.join(",") : null });
  };

  const clearAllFilters = () => {
    setSelectedCategory("All");
    setFilterNewArrivals(false);
    setFilterTrending(false);
    setPriceRange(50000);
    setSortBy("New Arrival");
    navigate("/shop");
  };

  return (
    <div className="bg-white min-h-screen relative">
      {!productsQuery && isServerProductsError && (
        <div className="mx-auto max-w-[1450px] px-4 pt-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="font-bold">
                Product list is using cached fallback data.
              </span>{" "}
              <span className="opacity-80">
                {serverProductsError?.response?.data?.message ||
                  serverProductsError?.message ||
                  ""}
              </span>
            </div>
            <button
              type="button"
              onClick={() => refetchServerProducts()}
              className="shrink-0 rounded-lg bg-[#3E2723] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white hover:opacity-95"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 md:px-6 pb-32 md:pb-8">
        {activeCategory && <CategoryHeroBanner category={activeCategory} />}
        {/* Sticky Header & Filters Container */}
        <div
          className={`sticky z-[40] bg-white transition-all duration-300 ${isNavVisible ? "top-[138px] md:top-[138px]" : "top-0"}`}
        >
          {/* Header Section - Back Left, Title Center, Items Right */}
          <div className="py-2 md:py-3 flex flex-row justify-between items-center gap-2 md:gap-4 border-b border-stone-200 px-4 md:px-0">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-stone-800 hover:text-[#C59B27] transition-all group font-bold uppercase tracking-wide text-[10px] md:text-xs shrink-0 min-w-[50px]"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>

            {/* Title - Center */}
            <div className="text-center flex-1 mx-1 overflow-hidden">
              <h1 className="text-base md:text-xl font-serif font-bold text-[#141211] leading-tight truncate tracking-wide">
                {pageTitle}
              </h1>
            </div>


            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsSortOpen(true)}
                className="p-1.5 border border-stone-300 rounded-lg text-stone-800 hover:border-[#C59B27] hover:text-[#C59B27] transition-all"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-1 bg-[#141211] text-[#E8D198] border border-[#C59B27]/40 px-2.5 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider"
              >
                <Filter className="w-3 h-3" />
                Filter
              </button>
            </div>
          </div>

          {/* Horizontal Desktop Filters - Alankar Jewellers Premium Style */}
          <HorizontalFilters
            categories={visibleCategories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            metal={
              queryParams.get("metal")?.charAt(0).toUpperCase() +
              queryParams.get("metal")?.slice(1) || "All"
            }
            onMetalChange={handleMetalChange}
            purity={purityQuery || karatQuery || silverTypeQuery || "All"}
            onPurityChange={handlePurityChange}
            stone={stoneQuery || diamondTypeQuery || "All"}
            onStonesChange={handleStonesChange}
            priceRange={priceRange}
            onPriceChange={handlePriceRangeChange}
            audience={queryParams.get("source") || "All"}
            onAudienceChange={handleAudienceChange}
            tags={queryParams.get("tags")?.split(",").filter(Boolean) || []}
            onTagsChange={handleTagsChange}
            availability={
              availabilityQuery ||
              (inStockQuery === "false"
                ? "all"
                : inStockQuery === "true"
                  ? "in_stock"
                  : "All")
            }
            onAvailabilityChange={handleAvailabilityChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            clearAll={clearAllFilters}
          />
        </div>

        {/* Product Grid */}
        {isLoading ||
          isPinnedLoading ||
          (!productsQuery &&
            isServerProductsLoading &&
            productsToRender.length === 0) ? (
          <div className="flex items-center justify-center py-20">
            <Loader fullPage={false} />
          </div>
        ) : (
          (() => {
            const isComingSoon = isComingSoonQuery;

            if (isComingSoon) {
              return (
                <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-[#C59B27]/10 border border-[#C59B27]/20 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-10 h-10 text-[#C59B27]" />
                  </div>
                  <h3 className="text-3xl font-serif text-[#141211] mb-3 italic">
                    Coming Soon
                  </h3>
                  <p className="text-stone-500 max-w-md mx-auto mb-8 text-sm">
                    We're currently handcrafting new exquisite designs for{" "}
                    <span className="text-[#141211] font-semibold">
                      {selectedCategory}
                    </span>
                    . Stay tuned!
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="bg-[#141211] text-[#E8D198] border border-[#C59B27]/40 px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#1C1917] transition-all shadow-lg"
                  >
                    Explore Other Collections
                  </button>
                </div>
              );
            }

            if (productsToRender.length > 0) {
              return (
                <div className="mt-6 md:mt-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 md:gap-6 gap-y-6 md:gap-y-10">
                    {productsToRender.map((product) => (
                      <ProductCard
                        key={product.id || product._id}
                        product={product}
                      />
                    ))}
                  </div>

                  {serverModeEnabled &&
                    serverPagination &&
                    Number(serverPagination.page) <
                    Number(serverPagination.pages) && (
                      <div className="mt-10 flex justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            updateShopQuery({ page: currentServerPage + 1 })
                          }
                          disabled={isServerProductsLoading}
                          className="rounded-full bg-[#141211] text-[#E8D198] border border-[#C59B27]/40 px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-[#1C1917] transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isServerProductsLoading ? "Loading..." : "Load More"}
                        </button>
                      </div>
                    )}
                </div>
              );
            }

            return (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <h3 className="text-2xl font-serif text-[#141211] mb-2">
                  No products found
                </h3>
                <p className="text-stone-500 text-sm">
                  Try adjusting your filters to find your perfect match.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#C59B27] hover:underline"
                >
                  <SlidersHorizontal className="w-4 h-4" /> Clear all filters
                </button>
              </div>
            );
          })()
        )}
      </div>

      {/* Mobile Bottom Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md z-[70] border-t border-stone-200 flex h-16 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-safe transition-all duration-300">
        {/* Sort Button (Custom Sheet Trigger) */}
        <div
          onClick={() => setIsSortOpen(true)}
          className="flex-1 border-r border-stone-200 relative flex flex-col items-center justify-center active:bg-[#FAF8F5] cursor-pointer py-2"
        >
          <span className="text-[#141211] font-black text-[11px] uppercase tracking-widest flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#C59B27]" /> Sort by
          </span>
          <span className="text-[10px] text-stone-500 font-bold mt-1 uppercase tracking-tighter">
            {sortBy}
          </span>
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setIsFilterOpen(true)}
          className="flex-1 flex flex-col items-center justify-center active:bg-[#FAF8F5] py-2 transition-colors"
        >
          <span className="text-[#141211] font-black text-[11px] uppercase tracking-widest flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#C59B27]" /> Filter
          </span>
          <span className="text-[10px] text-stone-500 font-bold mt-1 uppercase tracking-tighter">
            {selectedCategory !== "All" ||
              filterNewArrivals ||
              filterTrending ||
              priceRange < 50000 ||
              !!searchQuery
              ? "Filters applied"
              : "No filter applied"}
          </span>
        </button>
      </div>

      {/* Filter Sidebar Drawer */}
      {/* Overlay */}
      {isFilterOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[200] backdrop-blur-sm transition-opacity"
          onClick={() => setIsFilterOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-[320px] bg-white z-[210] shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-stone-200 ${isFilterOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-stone-200">
            <h3 className="text-xl font-serif text-[#141211]">Filters</h3>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="text-stone-400 hover:text-[#141211]"
            >
              <ChevronDown className="w-6 h-6 rotate-90" />
            </button>
          </div>

          <div
            {...sidebarScroll.events}
            ref={sidebarScroll.ref}
            className={`p-6 flex-1 overflow-y-auto space-y-10 custom-scrollbar overscroll-contain ${sidebarScroll.isDragging ? "cursor-grabbing select-none" : "cursor-grab"}`}
          >
            {/* 1. Product Type Filter */}
            <section>
              <h4 className="font-bold text-[#141211] text-[11px] uppercase tracking-[0.2em] mb-4">
                Product Type
              </h4>
              <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                <label className="flex items-center space-x-3 cursor-pointer group py-1">
                  <input
                    type="radio"
                    name="mobile-category"
                    value="All"
                    checked={selectedCategory === "All"}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="form-radio text-[#141211] focus:ring-[#C59B27] accent-[#C59B27] h-4 w-4 border-stone-300"
                  />
                  <span
                    className={`text-[13px] transition-all ${selectedCategory === "All" ? "text-[#141211] font-bold underline underline-offset-4 decoration-[#C59B27]" : "text-stone-600 group-hover:text-[#141211]"}`}
                  >
                    All Jewellery
                  </span>
                </label>
                {visibleCategories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center space-x-3 cursor-pointer group py-1"
                  >
                    <input
                      type="radio"
                      name="mobile-category"
                      value={cat.name}
                      checked={selectedCategory === cat.name}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="form-radio text-[#141211] focus:ring-[#C59B27] accent-[#C59B27] h-4 w-4 border-stone-300"
                    />
                    <span
                      className={`text-[13px] transition-all ${selectedCategory === cat.name ? "text-[#141211] font-bold underline underline-offset-4 decoration-[#C59B27]" : "text-stone-600 group-hover:text-[#141211]"}`}
                    >
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* 2. Metal / Material Filter */}
            <section className="pt-6 border-t border-stone-100">
              <h4 className="font-bold text-[#141211] text-[11px] uppercase tracking-[0.2em] mb-4">
                Metal / Material
              </h4>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "All", label: "All" },
                  { id: "gold", label: "Gold" },
                  { id: "silver", label: "Silver" },
                  { id: "diamond", label: "Diamond" },
                ].map((m) => {
                  const currentMetal = queryParams.get("metal")?.toLowerCase();
                  const isActive = m.id === "All" ? !currentMetal : currentMetal === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleMetalChange(m.id)}
                      className={`py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider border rounded-lg transition-all text-center ${isActive
                          ? "bg-[#141211] text-[#E8D198] border-[#C59B27] shadow-sm font-black"
                          : "bg-stone-50 text-stone-600 border-stone-200 hover:border-[#C59B27]"
                        }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 3. Purity Filter */}
            <section className="pt-6 border-t border-stone-100">
              <h4 className="font-bold text-[#141211] text-[11px] uppercase tracking-[0.2em] mb-4">
                Purity
              </h4>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const activeMetal = (queryParams.get("metal") || "").toLowerCase();
                  let options = [
                    { label: "All", value: "All" },
                    { label: "925 Sterling Silver", value: "925" },
                    { label: "24K Gold", value: "24" },
                    { label: "22K Gold", value: "22" },
                    { label: "18K Gold", value: "18" },
                    { label: "14K Gold", value: "14" },
                  ];
                  if (activeMetal === "silver") {
                    options = [
                      { label: "All", value: "All" },
                      { label: "925 Sterling Silver", value: "925" },
                      { label: "Fine Silver", value: "fine" },
                      { label: "800 Silver", value: "800" },
                    ];
                  } else if (activeMetal === "gold") {
                    options = [
                      { label: "All", value: "All" },
                      { label: "24K Gold", value: "24" },
                      { label: "22K Gold", value: "22" },
                      { label: "18K Gold", value: "18" },
                      { label: "14K Gold", value: "14" },
                    ];
                  } else if (activeMetal === "diamond") {
                    options = [
                      { label: "All", value: "All" },
                      { label: "18K Setting", value: "18" },
                      { label: "14K Setting", value: "14" },
                      { label: "Platinum 950", value: "platinum" },
                    ];
                  }
                  const activePurity = purityQuery || karatQuery || silverTypeQuery || "All";
                  return options.map((opt) => {
                    const isActive = activePurity === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handlePurityChange(opt.value)}
                        className={`px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider border rounded-full transition-all ${isActive
                            ? "bg-[#141211] text-[#E8D198] border-[#C59B27] shadow-sm font-black"
                            : "bg-stone-50 text-stone-600 border-stone-200 hover:border-[#C59B27]"
                          }`}
                      >
                        {opt.label}
                      </button>
                    );
                  });
                })()}
              </div>
            </section>

            {/* 4. Stones Filter */}
            <section className="pt-6 border-t border-stone-100">
              <h4 className="font-bold text-[#141211] text-[11px] uppercase tracking-[0.2em] mb-4">
                Stones
              </h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "All", value: "All" },
                  { label: "Plain / No Stone", value: "none" },
                  { label: "American Diamond (AD)", value: "ad" },
                  { label: "Natural Diamond", value: "natural" },
                  { label: "Lab-Grown Diamond", value: "lab_grown" },
                  { label: "Pearls & Kundan", value: "pearl_kundan" },
                ].map((s) => {
                  const activeStone = stoneQuery || diamondTypeQuery || "All";
                  const isActive = activeStone === s.value;
                  return (
                    <button
                      key={s.value}
                      onClick={() => handleStonesChange(s.value)}
                      className={`px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider border rounded-full transition-all ${isActive
                          ? "bg-[#141211] text-[#E8D198] border-[#C59B27] shadow-sm font-black"
                          : "bg-stone-50 text-stone-600 border-stone-200 hover:border-[#C59B27]"
                        }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 5. Price Range Filter */}
            <section className="pt-6 border-t border-stone-100">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-[#141211] text-[11px] uppercase tracking-[0.2em]">
                  Price Range
                </h4>
                <span className="text-[10px] font-black text-[#C59B27] bg-[#C59B27]/10 border border-[#C59B27]/20 px-2 py-0.5 rounded uppercase tracking-widest">
                  {priceRange >= 50000
                    ? "Any Price"
                    : `Under ${formatCurrency(priceRange)}`}
                </span>
              </div>
              <div className="px-1">
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="500"
                  value={priceRange}
                  onChange={(e) => handlePriceRangeChange(e.target.value)}
                  className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#C59B27]"
                />
                <div className="flex justify-between mt-3">
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">
                    ₹1,000
                  </span>
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">
                    ₹50,000+
                  </span>
                </div>
              </div>
            </section>

            {/* 6. Shop For Filter */}
            <section className="pt-6 border-t border-stone-100">
              <h4 className="font-bold text-[#141211] text-[11px] uppercase tracking-[0.2em] mb-4">
                Shop For
              </h4>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "all", label: "All" },
                  { id: "women", label: "Women" },
                  { id: "men", label: "Men" },
                  { id: "family", label: "Family" },
                ].map((aud) => {
                  const currentAud = (queryParams.get("source") || "all").toLowerCase();
                  const isActive = currentAud === aud.id;
                  return (
                    <button
                      key={aud.id}
                      onClick={() => handleAudienceChange(aud.id)}
                      className={`py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider border rounded-lg transition-all text-center ${isActive
                          ? "bg-[#141211] text-[#E8D198] border-[#C59B27] shadow-sm font-black"
                          : "bg-stone-50 text-stone-600 border-stone-200 hover:border-[#C59B27]"
                        }`}
                    >
                      {aud.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 7. Style Filter */}
            <section className="pt-6 border-t border-stone-100">
              <h4 className="font-bold text-[#141211] text-[11px] uppercase tracking-[0.2em] mb-4">
                Style
              </h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Trending", value: "isTrending" },
                  { label: "New Arrival", value: "isNewArrival" },
                  { label: "Best Selling", value: "isMostGifted" },
                  { label: "Premium", value: "isPremium" },
                ].map((tag) => {
                  const currentTags = queryParams.get("tags")?.split(",").filter(Boolean) || [];
                  const isActive = currentTags.includes(tag.value);
                  return (
                    <button
                      key={tag.value}
                      onClick={() => handleTagsChange(tag.value)}
                      className={`px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider border rounded-full transition-all ${isActive
                          ? "bg-[#141211] text-[#E8D198] border-[#C59B27] shadow-sm font-black"
                          : "bg-stone-50 text-stone-600 border-stone-200 hover:border-[#C59B27]"
                        }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 8. Availability Filter */}
            <section className="pt-6 border-t border-stone-100 pb-4">
              <h4 className="font-bold text-[#141211] text-[11px] uppercase tracking-[0.2em] mb-4">
                Availability
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "All", value: "All" },
                  { label: "In Stock", value: "in_stock" },
                  { label: "Out of Stock", value: "out_of_stock" },
                ].map((avail) => {
                  const activeAvail =
                    availabilityQuery ||
                    (inStockQuery === "false"
                      ? "all"
                      : inStockQuery === "true"
                        ? "in_stock"
                        : "All");
                  const isActive = activeAvail === avail.value;
                  return (
                    <button
                      key={avail.value}
                      onClick={() => handleAvailabilityChange(avail.value)}
                      className={`py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider border rounded-lg transition-all text-center ${isActive
                          ? "bg-[#141211] text-[#E8D198] border-[#C59B27] shadow-sm font-black"
                          : "bg-stone-50 text-stone-600 border-stone-200 hover:border-[#C59B27]"
                        }`}
                    >
                      {avail.label}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-stone-200 bg-white">
            <div className="flex gap-3">
              <button
                onClick={clearAllFilters}
                className="flex-1 py-3.5 border border-stone-300 text-[#141211] font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-stone-50 transition-all"
              >
                Reset
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="flex-[2] py-3.5 bg-[#141211] text-[#E8D198] border border-[#C59B27]/40 font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-lg hover:bg-[#1C1917] transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sort Bottom Sheet */}
      {isSortOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[200] backdrop-blur-sm transition-opacity"
            onClick={() => setIsSortOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white z-[210] rounded-t-2xl p-6 pb-8 animate-in slide-in-from-bottom duration-300 safe-bottom border-t border-stone-200">
            <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mb-6 opacity-60" />
            <h3 className="text-lg font-serif font-bold text-[#141211] mb-6">
              Sort By
            </h3>
            <div className="space-y-4">
              {[
                "New Arrival",
                "Discount",
                "Best Selling",
              ].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    handleSortChange(option);
                    setIsSortOpen(false);
                  }}
                  className="w-full flex items-center justify-between text-left py-2 group"
                >
                  <span
                    className={`text-sm transition-colors ${sortBy === option ? "font-bold text-[#141211]" : "text-stone-600 group-hover:text-[#141211]"}`}
                  >
                    {option}
                  </span>
                  {sortBy === option ? (
                    <div className="w-5 h-5 rounded-full bg-[#C59B27] flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-stone-300 group-hover:border-[#C59B27]" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-stone-100">
              <h3 className="text-lg font-serif font-bold text-[#141211] mb-6">
                Filter by Price
              </h3>
              <div className="px-2">
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="1000"
                  value={priceRange}
                  onChange={(e) => handlePriceRangeChange(e.target.value)}
                  className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#C59B27]"
                />
                <div className="flex justify-between mt-4">
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">
                    ₹1,000
                  </span>
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">
                    ₹{priceRange.toLocaleString()}{priceRange >= 50000 ? '+' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Shop;
