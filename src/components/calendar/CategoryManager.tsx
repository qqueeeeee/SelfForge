import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  loadCustomCategories,
  addCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
  resetToDefaultCategories,
  CATEGORY_COLORS,
  type CustomCategory,
} from "@/lib/custom-categories";
import { cn } from "@/lib/utils";
import { Plus, Edit2, Trash2, RotateCcw, Palette } from "lucide-react";

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChange?: () => void;
}

interface CategoryFormData {
  label: string;
  colorIndex: number;
}

export function CategoryManager({
  isOpen,
  onClose,
  onCategoriesChange,
}: CategoryManagerProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(
    null
  );
  const [deleteCategory, setDeleteCategory] = useState<CustomCategory | null>(
    null
  );
  const [formData, setFormData] = useState<CategoryFormData>({
    label: "",
    colorIndex: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load categories when component mounts or dialog opens
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = () => {
    try {
      const loadedCategories = loadCustomCategories();
      setCategories(loadedCategories);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    }
  };

  const handleCreateCategory = async () => {
    if (!formData.label.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const colorConfig = CATEGORY_COLORS[formData.colorIndex];
      await addCustomCategory(formData.label.trim(), {
        color: colorConfig.color,
        bgColor: colorConfig.bgColor,
        borderColor: colorConfig.borderColor,
      });

      toast({
        title: "Success",
        description: `Category "${formData.label}" created successfully`,
      });

      loadCategories();
      setIsCreateDialogOpen(false);
      setFormData({ label: "", colorIndex: 0 });
      onCategoriesChange?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !formData.label.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const colorConfig = CATEGORY_COLORS[formData.colorIndex];
      await updateCustomCategory(editingCategory.id, {
        label: formData.label.trim(),
        color: colorConfig.color,
        bgColor: colorConfig.bgColor,
        borderColor: colorConfig.borderColor,
      });

      toast({
        title: "Success",
        description: `Category "${formData.label}" updated successfully`,
      });

      loadCategories();
      setEditingCategory(null);
      setFormData({ label: "", colorIndex: 0 });
      onCategoriesChange?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update category",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategory) return;

    setIsLoading(true);
    try {
      await deleteCustomCategory(deleteCategory.id);

      toast({
        title: "Success",
        description: `Category "${deleteCategory.label}" deleted successfully`,
      });

      loadCategories();
      setDeleteCategory(null);
      onCategoriesChange?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToDefaults = async () => {
    setIsLoading(true);
    try {
      resetToDefaultCategories();
      loadCategories();
      onCategoriesChange?.();

      toast({
        title: "Success",
        description: "Categories reset to defaults",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset categories",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setFormData({ label: "", colorIndex: 0 });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (category: CustomCategory) => {
    const colorIndex = CATEGORY_COLORS.findIndex(
      (color) => color.color === category.color
    );
    setFormData({
      label: category.label,
      colorIndex: colorIndex >= 0 ? colorIndex : 0,
    });
    setEditingCategory(category);
  };

  const CategoryFormDialog = ({
    open,
    onOpenChange,
    title,
    onSubmit,
    submitText,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    onSubmit: () => void;
    submitText: string;
  }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Choose a name and color for your category.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Category Name</Label>
            <Input
              id="category-name"
              value={formData.label}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, label: e.target.value }))
              }
              placeholder="Enter category name..."
              maxLength={30}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORY_COLORS.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, colorIndex: index }))
                  }
                  className={cn(
                    "relative h-10 w-10 rounded-lg border-2 transition-all",
                    formData.colorIndex === index
                      ? "border-foreground scale-110"
                      : "border-border hover:border-foreground/50"
                  )}
                >
                  <div className={cn("h-full w-full rounded-md", color.preview)} />
                  {formData.colorIndex === index && (
                    <div className="absolute inset-0 rounded-lg bg-foreground/10" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border",
                CATEGORY_COLORS[formData.colorIndex].color,
                CATEGORY_COLORS[formData.colorIndex].bgColor,
                CATEGORY_COLORS[formData.colorIndex].borderColor
              )}
            >
              {formData.label || "Category Name"}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading || !formData.label.trim()}>
            {submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Manage Categories
            </DialogTitle>
            <DialogDescription>
              Create and manage your custom categories for events and tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={openCreateDialog} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Category
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetToDefaults}
                  disabled={isLoading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>

              {/* Categories Grid */}
              <div className="grid gap-3">
                {categories.map((category) => (
                  <Card key={category.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="secondary"
                          className={cn(
                            category.color,
                            category.bgColor,
                            category.borderColor,
                            "border"
                          )}
                        >
                          {category.label}
                        </Badge>
                        {category.isDefault && (
                          <span className="text-xs text-muted-foreground">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(category)}
                          disabled={isLoading}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {!category.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteCategory(category)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {categories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No categories found. Create your first category to get started.
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <CategoryFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Create New Category"
        onSubmit={handleCreateCategory}
        submitText="Create Category"
      />

      {/* Edit Category Dialog */}
      <CategoryFormDialog
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
        title="Edit Category"
        onSubmit={handleEditCategory}
        submitText="Update Category"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteCategory}
        onOpenChange={(open) => !open && setDeleteCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "
              {deleteCategory?.label}"? This action cannot be undone. Events and
              tasks using this category will need to be updated manually.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
