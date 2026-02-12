import { ItemCategory, ItemCategoryConfig } from "@/components/calendar/types";

// Storage key for custom categories
const CUSTOM_CATEGORIES_STORAGE_KEY = "selfforge-custom-categories";

// Default categories that come with the system
export const DEFAULT_CATEGORIES: Record<string, ItemCategoryConfig> = {
  "deep-work": {
    label: "Deep Work",
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    borderColor: "border-purple-200 dark:border-purple-700",
  },
  work: {
    label: "Work",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-700",
  },
  personal: {
    label: "Personal",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200 dark:border-green-700",
  },
  meeting: {
    label: "Meeting",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-700",
  },
};

// Available colors for custom categories
export const CATEGORY_COLORS = [
  {
    name: "Purple",
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    borderColor: "border-purple-200 dark:border-purple-700",
    preview: "bg-purple-500",
  },
  {
    name: "Blue",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-700",
    preview: "bg-blue-500",
  },
  {
    name: "Green",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200 dark:border-green-700",
    preview: "bg-green-500",
  },
  {
    name: "Red",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-700",
    preview: "bg-red-500",
  },
  {
    name: "Orange",
    color: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-200 dark:border-orange-700",
    preview: "bg-orange-500",
  },
  {
    name: "Yellow",
    color: "text-yellow-700 dark:text-yellow-300",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-200 dark:border-yellow-700",
    preview: "bg-yellow-500",
  },
  {
    name: "Pink",
    color: "text-pink-700 dark:text-pink-300",
    bgColor: "bg-pink-50 dark:bg-pink-900/20",
    borderColor: "border-pink-200 dark:border-pink-700",
    preview: "bg-pink-500",
  },
  {
    name: "Indigo",
    color: "text-indigo-700 dark:text-indigo-300",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    borderColor: "border-indigo-200 dark:border-indigo-700",
    preview: "bg-indigo-500",
  },
  {
    name: "Teal",
    color: "text-teal-700 dark:text-teal-300",
    bgColor: "bg-teal-50 dark:bg-teal-900/20",
    borderColor: "border-teal-200 dark:border-teal-700",
    preview: "bg-teal-500",
  },
  {
    name: "Gray",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-50 dark:bg-gray-900/20",
    borderColor: "border-gray-200 dark:border-gray-700",
    preview: "bg-gray-500",
  },
];

export interface CustomCategory {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomCategoriesStorage {
  categories: CustomCategory[];
  version: string;
  lastUpdated: Date;
}

// Generate a unique ID for new categories
function generateCategoryId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create a slug from a label (for backward compatibility with existing code)
export function createCategorySlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 30) || "custom";
}

// Load custom categories from localStorage
export function loadCustomCategories(): CustomCategory[] {
  try {
    const stored = localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);
    if (!stored) {
      // Initialize with default categories
      const defaultCategories = Object.entries(DEFAULT_CATEGORIES).map(
        ([id, config]) => ({
          id,
          label: config.label,
          color: config.color,
          bgColor: config.bgColor,
          borderColor: config.borderColor,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
      saveCustomCategories(defaultCategories);
      return defaultCategories;
    }

    const storage: CustomCategoriesStorage = JSON.parse(stored, (key, value) => {
      if (key === "createdAt" || key === "updatedAt" || key === "lastUpdated") {
        return new Date(value);
      }
      return value;
    });

    return storage.categories || [];
  } catch (error) {
    console.error("Failed to load custom categories:", error);
    return [];
  }
}

// Save custom categories to localStorage
export function saveCustomCategories(categories: CustomCategory[]): void {
  try {
    const storage: CustomCategoriesStorage = {
      categories,
      version: "1.0.0",
      lastUpdated: new Date(),
    };

    localStorage.setItem(
      CUSTOM_CATEGORIES_STORAGE_KEY,
      JSON.stringify(storage)
    );
  } catch (error) {
    console.error("Failed to save custom categories:", error);
    throw new Error("Failed to save categories");
  }
}

// Get all categories as a Record for backward compatibility
export function getCategoriesAsRecord(): Record<string, ItemCategoryConfig> {
  const categories = loadCustomCategories();
  const record: Record<string, ItemCategoryConfig> = {};

  categories.forEach((category) => {
    record[category.id] = {
      label: category.label,
      color: category.color,
      bgColor: category.bgColor,
      borderColor: category.borderColor,
    };
  });

  return record;
}

// Add a new custom category
export function addCustomCategory(
  label: string,
  colorConfig: {
    color: string;
    bgColor: string;
    borderColor: string;
  }
): CustomCategory {
  const categories = loadCustomCategories();

  // Check if a category with this label already exists
  const existingCategory = categories.find(
    (cat) => cat.label.toLowerCase() === label.toLowerCase()
  );

  if (existingCategory) {
    throw new Error("A category with this name already exists");
  }

  const newCategory: CustomCategory = {
    id: createCategorySlug(label),
    label: label.trim(),
    color: colorConfig.color,
    bgColor: colorConfig.bgColor,
    borderColor: colorConfig.borderColor,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Ensure the ID is unique
  let finalId = newCategory.id;
  let counter = 1;
  while (categories.some((cat) => cat.id === finalId)) {
    finalId = `${newCategory.id}-${counter}`;
    counter++;
  }
  newCategory.id = finalId;

  const updatedCategories = [...categories, newCategory];
  saveCustomCategories(updatedCategories);

  return newCategory;
}

// Update an existing category
export function updateCustomCategory(
  id: string,
  updates: Partial<Pick<CustomCategory, "label" | "color" | "bgColor" | "borderColor">>
): CustomCategory {
  const categories = loadCustomCategories();
  const categoryIndex = categories.findIndex((cat) => cat.id === id);

  if (categoryIndex === -1) {
    throw new Error("Category not found");
  }

  const category = categories[categoryIndex];

  if (category.isDefault && updates.label) {
    throw new Error("Cannot rename default categories");
  }

  // Check for duplicate labels (excluding current category)
  if (updates.label) {
    const duplicateLabel = categories.find(
      (cat, index) =>
        index !== categoryIndex &&
        cat.label.toLowerCase() === updates.label!.toLowerCase()
    );
    if (duplicateLabel) {
      throw new Error("A category with this name already exists");
    }
  }

  const updatedCategory: CustomCategory = {
    ...category,
    ...updates,
    updatedAt: new Date(),
  };

  categories[categoryIndex] = updatedCategory;
  saveCustomCategories(categories);

  return updatedCategory;
}

// Delete a custom category
export function deleteCustomCategory(id: string): boolean {
  const categories = loadCustomCategories();
  const category = categories.find((cat) => cat.id === id);

  if (!category) {
    throw new Error("Category not found");
  }

  if (category.isDefault) {
    throw new Error("Cannot delete default categories");
  }

  const updatedCategories = categories.filter((cat) => cat.id !== id);
  saveCustomCategories(updatedCategories);

  return true;
}

// Get category config with fallback (replaces the one in calendar-utils)
export function getCategoryConfig(categoryId: string): ItemCategoryConfig {
  const categories = getCategoriesAsRecord();

  return categories[categoryId] || {
    label: categoryId || "Unknown",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-50 dark:bg-gray-900/20",
    borderColor: "border-gray-200 dark:border-gray-700",
  };
}

// Get category by ID
export function getCategoryById(id: string): CustomCategory | undefined {
  const categories = loadCustomCategories();
  return categories.find((cat) => cat.id === id);
}

// Reset to default categories
export function resetToDefaultCategories(): void {
  const defaultCategories = Object.entries(DEFAULT_CATEGORIES).map(
    ([id, config]) => ({
      id,
      label: config.label,
      color: config.color,
      bgColor: config.bgColor,
      borderColor: config.borderColor,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );

  saveCustomCategories(defaultCategories);
}

// Migrate items that use old category system
export function migrateItemCategories(
  items: Array<{ category: string; [key: string]: any }>
): Array<{ category: string; [key: string]: any }> {
  const categories = loadCustomCategories();
  const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

  return items.map((item) => {
    // If category exists in our system, keep it
    if (categoryMap.has(item.category)) {
      return item;
    }

    // Try to find a category with similar label
    const similarCategory = categories.find(
      (cat) => cat.label.toLowerCase() === item.category?.toLowerCase()
    );

    if (similarCategory) {
      return { ...item, category: similarCategory.id };
    }

    // Create a new category for unknown ones
    try {
      const colorConfig = CATEGORY_COLORS[
        Math.floor(Math.random() * CATEGORY_COLORS.length)
      ];
      const newCategory = addCustomCategory(
        item.category || "Unknown",
        {
          color: colorConfig.color,
          bgColor: colorConfig.bgColor,
          borderColor: colorConfig.borderColor,
        }
      );
      return { ...item, category: newCategory.id };
    } catch (error) {
      // If creation fails, use the first available category
      return { ...item, category: categories[0]?.id || "work" };
    }
  });
}
