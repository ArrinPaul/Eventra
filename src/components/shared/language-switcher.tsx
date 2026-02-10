'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Languages, Check, Loader2 } from 'lucide-react';
import { setUserLocale } from '@/core/services/locale-service';
import { cn } from '@/core/utils/utils';

export function LanguageSwitcher() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  function onChange(value: string) {
    startTransition(async () => {
      await setUserLocale(value);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-white hover:bg-white/10">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Languages className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gray-900 border-white/10 text-white">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => onChange(lang.code)}
            className={cn(
              "cursor-pointer flex items-center justify-between gap-2 hover:bg-white/10",
              locale === lang.code && "text-cyan-400 bg-cyan-500/5"
            )}
          >
            <span className="flex items-center gap-2">
              <span className="text-sm">{lang.flag}</span>
              {lang.label}
            </span>
            {locale === lang.code && <Check className="h-3 w-3" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
