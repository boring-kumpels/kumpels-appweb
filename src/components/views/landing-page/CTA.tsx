import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Mind?
          </h2>
          <p className="text-xl mb-8">
            Join POSITIVE-Next today and start your journey to mental fitness
            and emotional intelligence.
          </p>
          <Link
            href="/sign-in"
            className="inline-flex items-center bg-primary-foreground text-primary px-8 py-3 rounded-md text-lg font-medium hover:bg-primary-foreground/90 transition-colors"
          >
            Get Started Now
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}
