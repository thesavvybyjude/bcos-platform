/**
 * BCOS Platform — Local Storage Client for Collections, Favorites & Recent Activity
 */

import { ModuleSummary } from "./api";

export interface StoredFavorite {
  id: string;
  slug: string;
  name: string;
  department: string;
  description: string;
  principle_count?: number;
  rule_count?: number;
  savedAt: string;
}

export interface StoredRecent {
  id: string;
  slug: string;
  name: string;
  department: string;
  description: string;
  visitedAt: string;
}

export interface StoredCollection {
  id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
  moduleSlugs: string[];
  createdAt: string;
  updatedAt: string;
}

const FAVORITES_KEY = "bcos_favorites";
const RECENT_KEY = "bcos_recent_views";
const COLLECTIONS_KEY = "bcos_collections";
const STORAGE_EVENT = "bcos_storage_updated";

const DEFAULT_COLLECTIONS: StoredCollection[] = [
  {
    id: "founder-core",
    name: "Founder Core Operating System",
    description: "Essential governance, operating rhythm, and decision frameworks for startup CEOs.",
    color: "#6b89ff",
    moduleSlugs: [
      "businessorganizationalstructurelegalentities",
      "businessbusinesssystemizationframework",
      "businessfinancialmanagementratios",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "growth-engine",
    name: "Growth & Scarcity Playbook",
    description: "High-impact strategies for demand generation, scarcity psychology, and retention.",
    color: "#ffb77d",
    moduleSlugs: [
      "marketingbrand-sponsorships-negotiation",
      "scarcitywinnerscurse",
      "salesrelationshipsales",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "negotiation-suite",
    name: "High-Stakes Negotiation Suite",
    description: "Frameworks for deal packaging, voice modulation, and value anchoring.",
    color: "#a78bfa",
    moduleSlugs: [
      "negotiationnegotiationoverview",
      "negotiationisitaridiculousidea",
      "communicationmethodologythethreevoices",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function dispatchUpdate(detail?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail }));
  }
}

// ── Favorites ──

export function getFavorites(): StoredFavorite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(slug: string): boolean {
  return getFavorites().some((f) => f.slug === slug);
}

export function toggleFavorite(
  module: { id?: string; slug: string; name: string; department: string; description?: string; principle_count?: number; rule_count?: number }
): boolean {
  const current = getFavorites();
  const exists = current.some((f) => f.slug === module.slug);
  let updated: StoredFavorite[];

  if (exists) {
    updated = current.filter((f) => f.slug !== module.slug);
  } else {
    const newFav: StoredFavorite = {
      id: module.id || module.slug,
      slug: module.slug,
      name: module.name,
      department: module.department,
      description: module.description || "",
      principle_count: module.principle_count || 0,
      rule_count: module.rule_count || 0,
      savedAt: new Date().toISOString(),
    };
    updated = [newFav, ...current];
  }

  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    dispatchUpdate("favorites");
  } catch (e) {
    console.error("Failed to update favorites:", e);
  }

  return !exists;
}

// ── Recent Activity ──

export function getRecentViews(): StoredRecent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentView(module: {
  id?: string;
  slug: string;
  name: string;
  department: string;
  description?: string;
}) {
  if (typeof window === "undefined") return;
  try {
    const current = getRecentViews().filter((r) => r.slug !== module.slug);
    const item: StoredRecent = {
      id: module.id || module.slug,
      slug: module.slug,
      name: module.name,
      department: module.department,
      description: module.description || "",
      visitedAt: new Date().toISOString(),
    };
    const updated = [item, ...current].slice(0, 30);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    dispatchUpdate("recent");
  } catch (e) {
    console.error("Failed to update recent views:", e);
  }
}

export function clearRecentViews() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RECENT_KEY);
  dispatchUpdate("recent");
}

// ── Collections ──

export function getCollections(): StoredCollection[] {
  if (typeof window === "undefined") return DEFAULT_COLLECTIONS;
  try {
    const raw = localStorage.getItem(COLLECTIONS_KEY);
    if (!raw) {
      localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(DEFAULT_COLLECTIONS));
      return DEFAULT_COLLECTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_COLLECTIONS;
  }
}

export function saveCollection(collection: Partial<StoredCollection> & { name: string }): StoredCollection {
  const current = getCollections();
  const id = collection.id || `col-${Date.now()}`;
  const now = new Date().toISOString();

  const existingIdx = current.findIndex((c) => c.id === id);
  let saved: StoredCollection;

  if (existingIdx >= 0) {
    saved = {
      ...current[existingIdx],
      ...collection,
      id,
      updatedAt: now,
    };
    current[existingIdx] = saved;
  } else {
    saved = {
      id,
      name: collection.name,
      description: collection.description || "",
      color: collection.color || "#6b89ff",
      moduleSlugs: collection.moduleSlugs || [],
      createdAt: now,
      updatedAt: now,
    };
    current.unshift(saved);
  }

  try {
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(current));
    dispatchUpdate("collections");
  } catch (e) {
    console.error("Failed to save collection:", e);
  }

  return saved;
}

export function deleteCollection(id: string) {
  const current = getCollections().filter((c) => c.id !== id);
  try {
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(current));
    dispatchUpdate("collections");
  } catch (e) {
    console.error("Failed to delete collection:", e);
  }
}

export function toggleModuleInCollection(collectionId: string, moduleSlug: string): boolean {
  const current = getCollections();
  const col = current.find((c) => c.id === collectionId);
  if (!col) return false;

  const exists = col.moduleSlugs.includes(moduleSlug);
  if (exists) {
    col.moduleSlugs = col.moduleSlugs.filter((s) => s !== moduleSlug);
  } else {
    col.moduleSlugs.push(moduleSlug);
  }
  col.updatedAt = new Date().toISOString();

  try {
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(current));
    dispatchUpdate("collections");
  } catch (e) {
    console.error("Failed to toggle module in collection:", e);
  }

  return !exists;
}

export { STORAGE_EVENT };
