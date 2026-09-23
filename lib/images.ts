/** Curated Unsplash imagery for popular destinations (stable photo URLs). */
const MAP: Record<string, string> = {
  Goa: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=70",
  Manali:
    "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=900&q=70",
  Kerala:
    "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=900&q=70",
  Ladakh:
    "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=900&q=70",
  Andaman:
    "https://images.unsplash.com/photo-1559494007-9f5847c49d94?auto=format&fit=crop&w=900&q=70",
  Rishikesh:
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=70",
  Kashmir:
    "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=900&q=70",
  Meghalaya:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Living_root_bridges%2C_Nongriat_village%2C_Meghalaya.jpg/330px-Living_root_bridges%2C_Nongriat_village%2C_Meghalaya.jpg",
  Spiti:
    "https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=900&q=70",
  Coorg:
    "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=900&q=70",
  Dubai:
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=70",
  Bali:
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=70",
  Singapore:
    "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=70",
  Thailand:
    "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=900&q=70",
  Maldives:
    "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=900&q=70",
  Malaysia:
    "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=900&q=70",
  Vietnam:
    "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=70",
  "Sri Lanka":
    "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=900&q=70",
  Azerbaijan:
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=70",
  Georgia:
    "https://images.unsplash.com/photo-1565008576549-57569a49371d?auto=format&fit=crop&w=900&q=70",
};

const FALLBACK =
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=70";

export function destinationImage(name: string) {
  return MAP[name] ?? FALLBACK;
}
