"use client";

import { useEffect, useState } from "react";
import { useApiCart } from "@/hooks/useApiCart";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function GrocerySuggestions() {
  const { items: cartItems } = useApiCart();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems]);

  const fetchSuggestions = async () => {
    if (!cartItems || cartItems.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const itemNames = cartItems.map((item) => item.name);
      const result = await apiClient.getGrocerySuggestions(itemNames) as { suggestions: string[] };
      setSuggestions(result.suggestions || []);
    } catch (err) {
      console.error("Error fetching grocery suggestions:", err);
      setError("Could not fetch suggestions at this time.");
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!cartItems || cartItems.length === 0) {
    return null; 
  }

  return (
    <Card className="mt-8 shadow-lg border-accent">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg text-accent">
          <Lightbulb className="mr-2 h-5 w-5" />
          You Might Also Need...
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="mr-2 h-6 w-6 animate-spin text-accent" />
            <p className="text-muted-foreground">Generating suggestions...</p>
          </div>
        )}
        {error && (
          <div className="text-destructive py-4">
            <p>{error}</p>
            <Button onClick={fetchSuggestions} variant="link" className="p-0 h-auto mt-1 text-accent">Try again</Button>
          </div>
        )}
        {!isLoading && !error && suggestions.length > 0 && (
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-center">
                 <Badge variant="outline" className="text-sm py-1 px-3 border-primary text-primary-foreground bg-primary/10">
                  {suggestion}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        {!isLoading && !error && suggestions.length === 0 && (
          <p className="text-muted-foreground py-4">No suggestions right now. Add more items to your cart!</p>
        )}
      </CardContent>
    </Card>
  );
}
