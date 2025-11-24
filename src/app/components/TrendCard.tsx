import React from "react";
import { Heart, Eye, ArrowRight } from "lucide-react";

interface TrendCardProps {
    image: string;
    caption: string;
    username: string;
    fullName: string;
    likesCount: number;
    index: number;
}

export default function TrendCard({
    image,
    caption,
    username,
    fullName,
    likesCount,
    index 
}: TrendCardProps) {
    return (
        <div className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            {/* Ranking Badge */}
            <div className="absolute top-3 left-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm shadow-lg">
                #{index}
            </div>

            <div className="flex items-center gap-4 p-4">
                {/* Post Image */}
                <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl ring-2 ring-white/10 group-hover:ring-purple-500/50 transition-all">
                    <img
                        src={image}
                        alt={caption}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                {/* Card Content */}
                <div className="flex-1 min-w-0">
                    <div className="mb-2">
                        <h3 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                            @{username}
                        </h3>
                        <p className="text-xs text-white/60 truncate">{fullName}</p>
                    </div>

                    {/* Likes */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30">
                            <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                            <span className="text-xs font-semibold text-white">{likesCount}</span>
                        </div>
                    </div>
                </div>

                {/* View Button */}
                <button className="flex-shrink-0 p-2 rounded-xl bg-white/10 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 text-white/70 hover:text-white transition-all duration-300 group/btn border border-white/10 hover:border-transparent">
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}
