import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { 
  LayoutDashboard, 
  PenTool,
  Search,
  CheckSquare
} from "lucide-react";
import { ViewType } from '@/hooks/useInterfacePreferences';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: ViewType) => void;
}

export const CommandPalette = ({ open, onOpenChange, onNavigate }: CommandPaletteProps) => {
  const navigate = useNavigate();

  const pages = [
    { value: 'home-criacao', label: 'Home', icon: LayoutDashboard },
    { value: 'copy', label: 'Copy', icon: PenTool },
    { value: 'aprovacao', label: 'Aprovação', icon: CheckSquare },
    { value: 'analise-bench', label: 'Análise e Bench', icon: Search },
  ];

  const handleSelect = (value: string) => {
    onNavigate(value as ViewType);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar páginas..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Páginas">
          {pages.map((page) => {
            const Icon = page.icon;
            return (
              <CommandItem
                key={page.value}
                value={page.value}
                onSelect={handleSelect}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{page.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
