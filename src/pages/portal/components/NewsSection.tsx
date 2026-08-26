import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Newspaper } from "lucide-react";
import RichTextDisplay from "@/components/common/RichTextDisplay";

type NewsItem = {
  title?: string;
  description?: string;
  href?: string;
  disabled?: boolean;
};

type NewsSectionProps = {
  heading?: string;
  subheading?: string;
  items?: NewsItem[];
};

const defaultNewsItems: NewsItem[] = [
  {
    title: "Portal announcement: New services available",
    description:
      "We have launched new public portal updates to help citizens access emergency services and report incidents faster.",
    href: "/#services",
  },
  {
    title: "Stay informed about disaster readiness",
    description:
      "Learn more about community preparedness and our new alert subscription system to receive timely warnings.",
    href: "/#about",
  },
];

const NewsSection: React.FC<NewsSectionProps> = ({ heading, subheading, items }) => {
  const resolvedItems = useMemo(() => {
    const rawItems = Array.isArray(items) && items.length > 0 ? items : defaultNewsItems;
    return rawItems.filter((item) => item?.disabled !== true);
  }, [items]);

  return (
    <section id="news" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-brand-600 text-sm font-semibold">
              <Newspaper className="w-4 h-4" />
              <span>{heading || "Latest Portal News"}</span>
            </div>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-slate-900 mt-5 tracking-tight"
          >
            {heading || "Latest Portal News"}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <RichTextDisplay
              html={subheading}
              fallback="Keep up with the latest updates, alerts, and public portal announcements."
              className="text-lg text-slate-500 font-medium [&_a]:text-brand-600 [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_p]:mb-3 [&_p:last-child]:mb-0"
            />
          </motion.div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {resolvedItems.map((item, index) => (
            <motion.article
              key={`${item.title || "news"}-${index}`}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06, duration: 0.45 }}
              className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4 text-brand-600">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-brand-100">
                  <Newspaper className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{item.title || "News update"}</h3>
              </div>
              <RichTextDisplay
                html={item.description}
                fallback="No news is available at the moment. Check back soon for updates."
                className="text-slate-600 leading-relaxed [&_a]:text-brand-600 [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0"
              />
              {item.href ? (
                <a
                  href={item.href}
                  className="mt-6 inline-flex items-center gap-2 font-bold text-brand-600"
                >
                  Read more →
                </a>
              ) : null}
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
