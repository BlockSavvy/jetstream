'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Input } from "@/components/ui/input";

// Define props for the component
interface LiamERDProps {
  focusedTable: string | null;
  onClearFocus: () => void;
}

// Simple ERD renderer without relying on external libraries
const LiamERD: React.FC<LiamERDProps> = ({ focusedTable, onClearFocus }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<any>(null);
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);
  const [hoveredRelation, setHoveredRelation] = useState<{
    source: string;
    target: string;
  } | null>(null);
  const [relationshipFilter, setRelationshipFilter] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    const fetchSchema = async () => {
      try {
        setLoading(true);
        
        // Fetch schema from API
        const schemaResponse = await fetch('/api/admin/database/schema')
          .then(res => res.ok ? res.json() : null)
          .catch(err => {
            console.error('Error fetching schema:', err);
            return null;
          });
        
        if (!isMounted) return;
        
        if (!schemaResponse) {
          throw new Error('Failed to fetch schema data');
        }
        
        setSchema(schemaResponse);
        setLoading(false);
      } catch (err: any) {
        if (isMounted) {
          console.error('Error loading schema:', err);
          setError(err.message || 'Failed to load schema visualization');
          setLoading(false);
        }
      }
    };
    
    fetchSchema();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Find tables related to a specific table
  const findRelatedTables = (tableName: string): string[] => {
    if (!schema || !schema.relationships) return [];
    
    const related = new Set<string>();
    schema.relationships.forEach((rel: any) => {
      if (rel.source_table === tableName) {
        related.add(rel.target_table);
      } else if (rel.target_table === tableName) {
        related.add(rel.source_table);
      }
    });
    return Array.from(related);
  };
  
  // Determine if a table should be highlighted or visible
  const getTableVisibility = (tableName: string): { isVisible: boolean; isHighlighted: boolean } => {
    if (!focusedTable) {
      const isHighlight = hoveredTable === tableName || 
                          (hoveredRelation && (hoveredRelation.source === tableName || hoveredRelation.target === tableName));
      return { isVisible: true, isHighlighted: !!isHighlight }; 
    }
    
    const relatedToFocused = findRelatedTables(focusedTable);
    const isVisible = tableName === focusedTable || relatedToFocused.includes(tableName);
    const isHighlight = hoveredTable === tableName || 
                        (hoveredRelation && (hoveredRelation.source === tableName || hoveredRelation.target === tableName));

    return { isVisible, isHighlighted: !!isHighlight };
  };
  
  // Sort tables to ensure consistent display order
  const sortedTables = () => {
    if (!schema || !schema.tables) return [];
    
    const coreTables = ['profiles', 'jets', 'flights', 'bookings', 'airports'];
    
    return [...schema.tables].sort((a, b) => {
      const aIsCore = coreTables.includes(a.name);
      const bIsCore = coreTables.includes(b.name);

      if (aIsCore && !bIsCore) return -1; // a comes first
      if (!aIsCore && bIsCore) return 1;  // b comes first
      
      // If both are core or both are not core, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  };
  
  const clearFocus = onClearFocus;

  // Render a basic ERD visualization
  const renderERD = () => {
    if (!schema || !schema.tables) return null;
    
    const allTables = sortedTables();
    const totalRelationships = schema.relationships?.length || 0;
    
    // Filter visible tables based on focus
    const visibleTables = allTables.filter(table => getTableVisibility(table.name).isVisible);
    
    // Function to scroll to relationships section
    const scrollToRelationships = () => {
      const relationshipsSection = document.getElementById('relationships-section');
      if (relationshipsSection) {
        relationshipsSection.scrollIntoView({ behavior: 'smooth' });
      }
    };
    
    // Filter relationships based on the filter text
    const filteredRelationships = (schema.relationships || []).filter((rel: any) => {
      if (!relationshipFilter) return true;
      const searchTerm = relationshipFilter.toLowerCase();
      return (
        rel.source_table.toLowerCase().includes(searchTerm) ||
        rel.source_column.toLowerCase().includes(searchTerm) ||
        rel.target_table.toLowerCase().includes(searchTerm) ||
        rel.target_column.toLowerCase().includes(searchTerm)
      );
    });

    return (
      <div className="w-full h-full overflow-auto p-4">
        <div className="mb-4 text-sm sticky top-0 bg-background pt-2 pb-2 border-b z-10 flex justify-between items-center">
          <div className="text-muted-foreground">
            <span className="font-medium">{allTables.length} tables</span> and <span className="font-medium">{totalRelationships} relationships</span> found
            {focusedTable && (
              <span className="ml-2 text-primary font-semibold">(Showing: {focusedTable} & relations)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {focusedTable && (
              <Button variant="outline" size="sm" onClick={clearFocus} className="h-7 px-2 py-1 text-xs">
                <X className="h-3 w-3 mr-1"/>
                Clear Focus
              </Button>
            )}
            {schema.relationships && schema.relationships.length > 0 && (
              <button 
                onClick={scrollToRelationships}
                className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
              >
                Jump to Relationships
              </button>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          {visibleTables.map((table: any) => {
            const relations = schema.relationships?.filter((rel: any) => 
              rel.source_table === table.name || rel.target_table === table.name
            ) || [];
            
            const { isHighlighted } = getTableVisibility(table.name);
            const isDimmed = (hoveredTable || hoveredRelation || focusedTable) && !isHighlighted && focusedTable !== table.name;
            const isFocus = focusedTable === table.name;
            
            return (
              <div 
                key={table.name} 
                className={`border rounded-md shadow-sm w-64 flex flex-col transition-all duration-200 cursor-pointer ${ 
                  isFocus ? 'ring-2 ring-offset-2 ring-blue-500 shadow-lg z-20' : 
                  isHighlighted ? 'ring-1 ring-primary shadow-md z-10' : 
                  isDimmed ? 'opacity-40' : '' 
                }`}
                onMouseEnter={() => setHoveredTable(table.name)}
                onMouseLeave={() => setHoveredTable(null)}
              >
                <div className="border-b bg-muted p-2 font-bold text-center flex justify-between items-center">
                  <span>{table.name}</span>
                  {relations.length > 0 && (
                    <span className={`text-xs px-1 py-0.5 rounded-full ${isFocus ? 'bg-blue-100 text-blue-700' : 'bg-primary/20 text-primary'}`}>
                      {relations.length} relations
                    </span>
                  )}
                </div>
                <div className="p-2 flex-1 overflow-y-auto max-h-60">
                  <ul className="divide-y">
                    {table.columns?.map((column: any) => (
                      <li key={column.name} className="py-1 text-sm">
                        <div className="flex items-center justify-between">
                          <span className={column.primary_key ? 'font-bold' : ''}>
                            {column.name}
                            {column.primary_key && ' 🔑'}
                            {column.foreign_key && <span className="ml-1 text-blue-500 text-xs font-normal">[FK]</span>}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {column.type}
                            {column.nullable ? ' (null)' : ''}
                          </span>
                        </div>
                        {column.foreign_key && (
                          <div 
                            className="text-xs text-blue-500 mt-1 cursor-pointer hover:underline"
                            onMouseEnter={(e) => { 
                              e.stopPropagation();
                              setHoveredRelation({
                                source: table.name,
                                target: column.foreign_key.table
                              });
                            }}
                            onMouseLeave={() => setHoveredRelation(null)}
                          >
                            → {column.foreign_key.table}.{column.foreign_key.column}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Table Relationships List - Add filter input and hover handlers */}
        {schema.relationships && schema.relationships.length > 0 && (
          <div id="relationships-section" className="mt-8 border rounded-lg p-4 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">All Relationships {focusedTable ? `(Related to ${focusedTable})` : ''}</h3>
              <Input 
                type="text"
                placeholder="Filter relationships..." 
                className="max-w-xs h-8 text-xs"
                value={relationshipFilter}
                onChange={(e) => setRelationshipFilter(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredRelationships
                .filter((rel: any) => !focusedTable || rel.source_table === focusedTable || rel.target_table === focusedTable)
                .map((rel: any, index: number) => (
                  <div 
                    key={`${rel.source_table}-${rel.source_column}-${rel.target_table}-${rel.target_column}-${index}`}
                    className="text-sm p-2 border rounded hover:bg-muted cursor-default transition-colors"
                    onMouseEnter={() => setHoveredRelation({
                      source: rel.source_table,
                      target: rel.target_table
                    })}
                    onMouseLeave={() => setHoveredRelation(null)}
                  >
                    <span className="font-medium">{rel.source_table}</span>
                    <span className="text-muted-foreground">.{rel.source_column}</span>
                    <span className="mx-1">→</span>
                    <span className="font-medium">{rel.target_table}</span>
                    <span className="text-muted-foreground">.{rel.target_column}</span>
                  </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-red-500 mb-2">Error loading database schema</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-[800px] overflow-auto">
      {loading ? (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        renderERD()
      )}
    </div>
  );
};

export default LiamERD; 