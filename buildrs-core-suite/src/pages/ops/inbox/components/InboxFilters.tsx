
'use client';

import { useSearchParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export function InboxFilters() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const type = params.get('type') ?? 'all';
  const priority = params.get('priority') ?? '';
  const source = params.get('source') ?? 'all';
  const assignedToMe = params.get('me') === '1';
  const q = params.get('q') ?? '';
  const sort = params.get('sort') ?? 'newest';

  function updateParam(key: string, value: string | null) {
    const newParams = new URLSearchParams(params);
    if (value && value !== '' && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset to page 1 when filters change
    newParams.delete('page');
    navigate(`?${newParams.toString()}`, { replace: true });
  }

  function clearFilters() {
    navigate('/ops/inbox', { replace: true });
  }

  const hasActiveFilters = type !== 'all' || priority !== '' || source !== 'all' || assignedToMe || q !== '' || sort !== 'newest';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Zoeken..."
          value={q}
          onChange={(e) => updateParam('q', e.target.value)}
          className="w-64"
        />
        
        <Select value={type} onValueChange={(v) => updateParam('type', v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle types</SelectItem>
            <SelectItem value="needs_approval">Goedkeuring</SelectItem>
            <SelectItem value="workflow_issue">Workflow issue</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={(v) => updateParam('priority', v)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Prioriteit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Alle</SelectItem>
            <SelectItem value="1">P1</SelectItem>
            <SelectItem value="2">P2</SelectItem>
            <SelectItem value="3">P3</SelectItem>
            <SelectItem value="4">P4</SelectItem>
            <SelectItem value="5">P5</SelectItem>
          </SelectContent>
        </Select>

        <Select value={source} onValueChange={(v) => updateParam('source', v)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Bron" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="ops">Ops</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => updateParam('sort', v)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sorteren" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Nieuwste</SelectItem>
            <SelectItem value="priority">Prioriteit</SelectItem>
            <SelectItem value="age">Leeftijd</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={assignedToMe ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateParam('me', assignedToMe ? null : '1')}
        >
          Aan mij
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Wis filters
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1">
          {type !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Type: {type === 'needs_approval' ? 'Goedkeuring' : 'Workflow issue'}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateParam('type', 'all')} />
            </Badge>
          )}
          {priority && priority !== '' && (
            <Badge variant="secondary" className="gap-1">
              P{priority}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateParam('priority', '')} />
            </Badge>
          )}
          {source !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {source}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateParam('source', 'all')} />
            </Badge>
          )}
          {assignedToMe && (
            <Badge variant="secondary" className="gap-1">
              Aan mij
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateParam('me', null)} />
            </Badge>
          )}
          {q && (
            <Badge variant="secondary" className="gap-1">
              "{q}"
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateParam('q', '')} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
