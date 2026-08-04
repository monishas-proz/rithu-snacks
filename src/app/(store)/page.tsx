import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Truck, Shield, Clock } from "lucide-react";

export default function HomePage() {
  return (
    <div>
      <section className="relative bg-gradient-to-r from-primary/10 to-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Premium <span className="text-primary">Snacks</span> for Every Occasion
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover our curated collection of premium snacks. From traditional flavors to modern treats, we bring you the best.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/products">
              <Button size="lg">
                Shop Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/categories">
              <Button variant="outline" size="lg">
                Browse Categories
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Wide Selection</h3>
              <p className="text-sm text-muted-foreground">100+ premium snacks</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Fast Delivery</h3>
              <p className="text-sm text-muted-foreground">Quick & reliable shipping</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Quality Assured</h3>
              <p className="text-sm text-muted-foreground">Fresh & authentic products</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">24/7 Support</h3>
              <p className="text-sm text-muted-foreground">Always here to help</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
          <p className="text-muted-foreground mb-8">Coming soon - curated selection of our best snacks</p>
          <Link href="/products">
            <Button variant="outline">
              View All Products <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Categories</h2>
          <p className="text-muted-foreground mb-8">Explore our snack categories</p>
          <Link href="/categories">
            <Button variant="outline">
              Browse Categories <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
