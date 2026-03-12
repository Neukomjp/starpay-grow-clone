'use client'

import { Service } from '@/types/staff'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface MenuListProps {
    menuItems: Service[]
}

export function MenuList({ menuItems }: MenuListProps) {
    const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})

    return (
        <div className="grid md:grid-cols-2 gap-6">
            {menuItems.length > 0 ? (
                menuItems.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center p-4 bg-white rounded-lg shadow-sm border border-stone-100">
                        {item.image_url && (
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md">
                                <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0 mr-4">
                            <div className="font-medium text-lg truncate">{item.name}</div>
                            <div className="text-sm text-gray-500 truncate">{item.category}</div>
                            {item.description && (
                                <div className="mt-1">
                                    <button
                                        type="button"
                                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            setExpandedDescriptions(prev => ({
                                                ...prev,
                                                [item.id]: !prev[item.id]
                                            }))
                                        }}
                                    >
                                        {expandedDescriptions[item.id] ? (
                                            <>詳細を閉じる <ChevronUp className="h-3 w-3" /></>
                                        ) : (
                                            <>詳細を見る <ChevronDown className="h-3 w-3" /></>
                                        )}
                                    </button>
                                    {expandedDescriptions[item.id] && (
                                        <div className="text-sm text-gray-600 mt-2 whitespace-pre-wrap break-words border-t pt-2 border-gray-100">
                                            {item.description}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="text-sm text-gray-400 mt-1">{item.duration_minutes}分</div>
                        </div>
                        <span className="font-bold text-lg shrink-0">¥{item.price}</span>
                    </div>
                ))
            ) : (
                <p className="text-center col-span-2 text-gray-500">表示できるメニューがありません。</p>
            )}
        </div>
    )
}
