import { notFound } from "next/navigation";
import { db } from "@skinner/db";

const stepLabels: Record<string, string> = {
  cleanser: "Limpeza",
  toner: "Tonico",
  serum: "Serum",
  moisturizer: "Hidratante",
  SPF: "Protetor Solar",
  treatment: "Tratamento",
  mask: "Mascara",
  exfoliant: "Esfoliante",
  "eye-cream": "Creme para olhos",
};

const sessionFrequencyLabels: Record<string, string> = {
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
};

export default async function ManualKitPage({
  params,
}: {
  params: { tenantSlug: string; kitSlug: string };
}) {
  const tenant = await db.tenant.findUnique({
    where: { slug: params.tenantSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      disclaimer: true,
    },
  });

  if (!tenant) {
    notFound();
  }

  const kit = await db.kit.findUnique({
    where: {
      tenantId_slug: {
        tenantId: tenant.id,
        slug: params.kitSlug,
      },
    },
    include: {
      items: {
        orderBy: { rank: "asc" },
        include: { product: true },
      },
    },
  });

  if (!kit || !kit.isActive) {
    notFound();
  }

  const productItems = kit.items.filter(
    (i) => !i.product.type || i.product.type === "product"
  );
  const serviceItems = kit.items.filter((i) => i.product.type === "service");

  const productTotal = productItems.reduce(
    (sum, i) => sum + (i.product.price ?? 0),
    0
  );
  const discountedTotal =
    kit.discount != null && productTotal > 0
      ? productTotal * (1 - kit.discount / 100)
      : null;

  return (
    <main className="min-h-screen bg-blanc-casse">
      {/* Header */}
      <header className="py-4 px-6 border-b border-sable/20 flex items-center justify-center bg-white">
        {tenant.logoUrl ? (
          <img
            src={tenant.logoUrl}
            alt={tenant.name}
            className="h-8 object-contain"
          />
        ) : (
          <img
            src="/brand/logo-primary.png"
            alt="Skinner"
            className="h-10 object-contain"
          />
        )}
      </header>

      <div className="w-full max-w-lg mx-auto px-4 py-10 pb-16">

        {/* Kit headline */}
        <div className="text-center mb-10">
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-4">
            Kit de Tratamento
          </p>
          <h1 className="font-serif text-2xl text-carbone italic">{kit.name}</h1>
          <div className="w-12 h-px bg-sable mx-auto mt-4 mb-4" />
          {kit.description && (
            <p className="text-sm text-pierre font-light leading-relaxed">
              {kit.description}
            </p>
          )}
        </div>

        {/* Product items */}
        {productItems.length > 0 && (
          <div className="mb-8">
            <h2 className="font-serif text-lg text-carbone mb-4">
              Produtos
            </h2>
            <div className="space-y-3">
              {productItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-5 bg-white border border-sable/20"
                >
                  <div className="flex gap-4">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-ivoire flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-pierre font-light">
                          #{idx + 1}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm text-carbone">
                            {item.product.name}
                          </h3>
                          {item.product.stepRoutine && (
                            <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                              {stepLabels[item.product.stepRoutine] ??
                                item.product.stepRoutine}
                            </span>
                          )}
                        </div>
                        {item.product.price != null && (
                          <span className="text-sm text-carbone flex-shrink-0">
                            R$ {item.product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {item.product.description && (
                        <p className="text-xs text-pierre font-light mt-1">
                          {item.product.description}
                        </p>
                      )}
                      {item.note && (
                        <p className="text-xs text-pierre/60 font-light mt-1 italic">
                          {item.note}
                        </p>
                      )}
                      {item.product.ecommerceLink && (
                        <a
                          href={item.product.ecommerceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-3 px-4 py-2 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre transition-colors"
                        >
                          Comprar
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Service items */}
        {serviceItems.length > 0 && (
          <div className="mb-8">
            <h2 className="font-serif text-lg text-carbone mb-4">
              Tratamentos
            </h2>
            <div className="space-y-3">
              {serviceItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-5 bg-white border border-sable/20"
                >
                  <div className="flex gap-4">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-ivoire flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-pierre font-light">
                          #{idx + 1}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm text-carbone">
                            {item.product.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {item.product.sessionCount != null && (
                              <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                                {item.product.sessionCount}{" "}
                                {item.product.sessionCount === 1
                                  ? "sessao"
                                  : "sessoes"}
                              </span>
                            )}
                            {item.product.sessionCount != null &&
                              (item.product.sessionFrequency ||
                                item.product.durationMinutes) && (
                                <span className="text-[10px] text-pierre/40 font-light">
                                  ·
                                </span>
                              )}
                            {item.product.sessionFrequency && (
                              <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                                {sessionFrequencyLabels[
                                  item.product.sessionFrequency
                                ] ?? item.product.sessionFrequency}
                              </span>
                            )}
                            {item.product.sessionFrequency &&
                              item.product.durationMinutes && (
                                <span className="text-[10px] text-pierre/40 font-light">
                                  ·
                                </span>
                              )}
                            {item.product.durationMinutes != null && (
                              <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                                {item.product.durationMinutes} min
                              </span>
                            )}
                          </div>
                        </div>
                        {item.product.price != null && (
                          <span className="text-sm text-carbone flex-shrink-0">
                            R$ {item.product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {item.product.description && (
                        <p className="text-xs text-pierre font-light mt-1">
                          {item.product.description}
                        </p>
                      )}
                      {item.note && (
                        <p className="text-xs text-pierre/60 font-light mt-1 italic">
                          {item.note}
                        </p>
                      )}
                      {item.product.bookingLink && (
                        <a
                          href={item.product.bookingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-3 px-4 py-2 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre transition-colors"
                        >
                          Agendar
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kit total pricing */}
        {productTotal > 0 && (
          <div className="mb-8 p-5 bg-white border border-sable/20">
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-4">
              Resumo do Kit
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-pierre font-light">
                  Total dos produtos
                </span>
                {discountedTotal !== null ? (
                  <span className="text-sm text-pierre font-light line-through">
                    R$ {productTotal.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-sm text-carbone">
                    R$ {productTotal.toFixed(2)}
                  </span>
                )}
              </div>
              {discountedTotal !== null && kit.discount !== null && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-pierre font-light">
                      Desconto do kit ({kit.discount}%)
                    </span>
                    <span className="text-sm text-terre font-light">
                      - R$ {(productTotal - discountedTotal).toFixed(2)}
                    </span>
                  </div>
                  <div className="h-px bg-sable/20 my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-carbone">
                      Total com desconto
                    </span>
                    <span className="text-base text-carbone font-serif">
                      R$ {discountedTotal.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        {tenant.disclaimer && (
          <div className="mb-6 p-5 bg-ivoire border border-sable/20">
            <p className="text-xs text-pierre font-light italic leading-relaxed">
              {tenant.disclaimer}
            </p>
          </div>
        )}

        <p className="text-[10px] text-sable text-center uppercase tracking-wider font-light">
          Powered by Skinner
        </p>
      </div>
    </main>
  );
}
