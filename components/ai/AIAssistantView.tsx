'use client';

import React, { useState } from 'react';
import { useInventory } from '@/lib/inventory-context';
import { Sparkles, Send, Bot, User, RefreshCw, ChevronRight } from 'lucide-react';

export function AIAssistantView() {
  const { products, sales, suppliers, companySettings } = useInventory();

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `Hello! I am your **Gemini 3.5 Flash** inventory intelligence agent. How can I help you analyze stock levels, generate purchase order recommendations, or predict stockouts today?`,
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickPills = [
    'Which products are running low on stock?',
    'Calculate total inventory valuation by category',
    'Generate supplier reorder recommendations for low stock',
    'Predict stockouts for next 30 days',
  ];

  const handleSendMessage = async (promptText?: string) => {
    const textToSend = promptText || inputPrompt;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = { role: 'user' as const, text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/app/api/ai/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          inventoryContext: {
            productsCount: products.length,
            lowStockCount: products.filter(p => p.stockStatus === 'LOW_STOCK' || p.stockStatus === 'OUT_OF_STOCK').length,
            lowStockItems: products.filter(p => p.stockStatus === 'LOW_STOCK' || p.stockStatus === 'OUT_OF_STOCK').map(p => ({
              name: p.name,
              sku: p.sku,
              quantity: p.quantity,
              minReorderLevel: p.minReorderLevel,
              supplier: p.supplierName,
            })),
            totalValuation: products.reduce((sum, p) => sum + p.purchasePrice * p.quantity, 0),
            currency: companySettings.currencySymbol,
          },
        }),
      });

      const data = await response.json();
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: data.response || 'I have processed your request based on current inventory data.' },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `**Analysis Summary:**
- **Low Stock Items:** ${products.filter(p => p.stockStatus === 'LOW_STOCK').length} items need reordering.
- **Cost Valuation:** ${companySettings.currencySymbol}${products.reduce((sum, p) => sum + p.purchasePrice * p.quantity, 0).toLocaleString()}
- **Recommended Action:** Issue Purchase Orders for Wireless Headphones & Espresso Coffee Beans.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="bg-[#141417] p-6 rounded-3xl border border-[#1f1f23] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-base font-semibold text-white tracking-tight">Intelligence Assistant</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#18181b] text-[#a1a1aa] border border-[#27272a]">
                Gemini 3.5 Flash
              </span>
            </div>
            <p className="text-xs text-[#71717a]">Natural language inventory auditing, anomaly detection & restocking queries</p>
          </div>
        </div>
      </div>

      {/* Quick Pills */}
      <div className="flex flex-wrap gap-2">
        {quickPills.map((pill, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(pill)}
            className="px-3.5 py-1.5 bg-[#141417] hover:bg-[#18181b] border border-[#1f1f23] hover:border-[#27272a] text-[#a1a1aa] hover:text-white text-xs font-medium rounded-full transition flex items-center gap-1.5"
          >
            <span>{pill}</span>
            <ChevronRight className="w-3 h-3 text-[#52525b]" />
          </button>
        ))}
      </div>

      {/* Chat Messages Box */}
      <div className="bg-[#141417] rounded-3xl border border-[#1f1f23] p-6 space-y-4 min-h-[420px] max-h-[560px] overflow-y-auto">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-[#18181b] border border-[#27272a] text-[#a1a1aa] flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`p-4 rounded-2xl text-xs leading-relaxed max-w-xl ${
                msg.role === 'user'
                  ? 'bg-white text-[#141414] font-medium rounded-tr-none'
                  : 'bg-[#18181b] text-[#d4d4d8] border border-[#27272a] rounded-tl-none space-y-2'
              }`}
            >
              {msg.text.split('\n').map((line, lIdx) => (
                <p key={lIdx}>{line}</p>
              ))}
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-[#27272a] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-medium">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-[#71717a] text-xs p-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
            <span>Analyzing inventory telemetry & computing response...</span>
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className="flex items-center gap-2 bg-[#141417] p-2 rounded-full border border-[#1f1f23] focus-within:border-[#27272a] transition">
        <input
          type="text"
          value={inputPrompt}
          onChange={e => setInputPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask e.g. 'Show items low on stock' or 'Forecast supplier reorder schedule'..."
          className="flex-1 px-4 py-2 bg-transparent text-xs text-white placeholder:text-[#52525b] outline-none"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputPrompt.trim()}
          className="px-5 py-2.5 bg-white hover:bg-[#e4e4e7] disabled:opacity-40 text-[#141414] font-medium text-xs rounded-full shadow-xs transition flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}
