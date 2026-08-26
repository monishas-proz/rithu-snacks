import * as React from "react";
import {
  HeroSlider,
  CategorySection,
  ProductSection,
  Banner,
  Pledge,
  Tradition,
  Features,
  Feedback,
} from "@/components/storefront";

export default function HomePage() {
  return (
    <div className="pb-16 lg:pb-0 bg-white">
      <HeroSlider />
      <CategorySection />
      <ProductSection />
      <Banner />
      <Pledge />
      <Tradition />
      <Features />
      <Feedback />
    </div>
  );
}
