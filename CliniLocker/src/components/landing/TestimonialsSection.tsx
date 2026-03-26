import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Dr. A. Menon",
    role: "Cardiologist, Apollo Clinic",
    quote:
      "CliniLocker makes patient records instantly accessible. Sharing reports with families and specialists is now effortless.",
  },
  {
    name: "Priya R.",
    role: "Patient & Caregiver",
    quote:
      "I keep all my parents’ reports in one place. Reminders are timely and the sharing link is super convenient.",
  },
  {
    name: "Rohit K.",
    role: "Lab Manager",
    quote:
      "We reduced follow-ups dramatically. The secure vault and quick share links have transformed our workflow.",
  },
];

const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="testimonials" className="py-16 sm:py-20 lg:py-24 bg-background relative">
      <div className="absolute inset-x-0 top-0 h-64 bg-primary/5 blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 relative" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-widest">Testimonials</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-4 mb-6">
            Trusted by Patients and Providers
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Hear how CliniLocker is simplifying reports, reminders, and secure sharing for everyone.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6 sm:p-8 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-1 text-yellow-400 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">“{t.quote}”</p>
              <div>
                <p className="font-bold text-foreground">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
