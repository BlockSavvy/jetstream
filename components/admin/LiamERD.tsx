'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';

// Simple ERD renderer without relying on external libraries
const LiamERD: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<any>(null);
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);
  const [hoveredRelation, setHoveredRelation] = useState<{
    source: string;
    target: string;
  } | null>(null);

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
  const findRelatedTables = (tableName: string) => {
    if (!schema || !schema.relationships) return [];
    
    return schema.relationships
      .filter((rel: any) => 
        rel.source_table === tableName || rel.target_table === tableName
      )
      .map((rel: any) => 
        rel.source_table === tableName ? rel.target_table : rel.source_table
      );
  };
  
  // Determine if a table should be highlighted
  const isHighlighted = (tableName: string) => {
    if (hoveredTable === tableName) return true;
    if (!hoveredTable && !hoveredRelation) return false;
    
    if (hoveredRelation) {
      return hoveredRelation.source === tableName || hoveredRelation.target === tableName;
    }
    
    const relatedTables = findRelatedTables(hoveredTable!);
    return relatedTables.includes(tableName);
  };
  
  // Sort tables to ensure consistent display order
  const sortedTables = () => {
    if (!schema || !schema.tables) return [];
    
    return [...schema.tables].sort((a, b) => {
      // Primary tables first
      const aPrimary = ['profiles', 'jets', 'flights', 'bookings', 'airports'].includes(a.name);
      const bPrimary = ['profiles', 'jets', 'flights', 'bookings', 'airports'].includes(b.name);
      
      if (aPrimary && !bPrimary) return -1;
      if (!aPrimary && bPrimary) return 1;
      
      // Then alphabetically
      return a.name.localeCompare(b.name);
    });
  };
  
  // Render a basic ERD visualization
  const renderERD = () => {
    if (!schema || !schema.tables) return null;
    
    const tables = sortedTables();
    const totalRelationships = schema.relationships?.length || 0;
    
    // Function to scroll to relationships section
    const scrollToRelationships = () => {
      const relationshipsSection = document.getElementById('relationships-section');
      if (relationshipsSection) {
        relationshipsSection.scrollIntoView({ behavior: 'smooth' });
      }
    };
    
    return (
      <div className="w-full h-full overflow-auto p-4">
        <div className="mb-4 text-sm sticky top-0 bg-background pt-2 pb-2 border-b z-10 flex justify-between items-center">
          <div className="text-muted-foreground">
            <span className="font-medium">{tables.length} tables</span> and <span className="font-medium">{totalRelationships} relationships</span> found in database
          </div>
          {schema.relationships && schema.relationships.length > 0 && (
            <button 
              onClick={scrollToRelationships}
              className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
            >
              Jump to Relationships
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          {tables.map((table: any) => {
            const relations = schema.relationships?.filter((rel: any) => 
              rel.source_table === table.name || rel.target_table === table.name
            ) || [];
            
            const isTableHighlighted = isHighlighted(table.name);
            
            return (
              <div 
                key={table.name} 
                className={`border rounded-md shadow-sm w-64 flex flex-col transition-all duration-200 ${
                  isTableHighlighted 
                    ? 'ring-2 ring-primary shadow-md z-10' 
                    : hoveredTable || hoveredRelation 
                      ? 'opacity-60' 
                      : ''
                }`}
                onMouseEnter={() => setHoveredTable(table.name)}
                onMouseLeave={() => setHoveredTable(null)}
              >
                <div className="border-b bg-muted p-2 font-bold text-center flex justify-between items-center">
                  <span>{table.name}</span>
                  {relations.length > 0 && (
                    <span className="text-xs bg-primary/20 text-primary px-1 py-0.5 rounded-full">
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
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {column.type}
                            {column.nullable ? ' (null)' : ''}
                          </span>
                        </div>
                        {column.foreign_key && (
                          <div 
                            className="text-xs text-blue-500 mt-1 cursor-pointer hover:underline"
                            onMouseEnter={() => setHoveredRelation({
                              source: table.name,
                              target: column.foreign_key.table
                            })}
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
        
        {/* Table Relationships List */}
        {schema.relationships && schema.relationships.length > 0 && (
          <div id="relationships-section" className="mt-8 border rounded-lg p-4 mb-8">
            <h3 className="font-bold mb-2">All Relationships</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {schema.relationships.map((rel: any, index: number) => (
                <div 
                  key={index} 
                  className="text-sm p-2 border rounded hover:bg-muted cursor-pointer transition-colors"
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