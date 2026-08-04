"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

function CartEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Looks like you haven&apos;t added any items to your cart yet.
        Browse our products and find something you like!
      </p>
      <Link href="/products">
        <Button>Continue Shopping</Button>
      </Link>
    </div>
  );
}

export { CartEmpty };
