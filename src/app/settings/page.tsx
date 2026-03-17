"use client";

import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/theme-context";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="font-semibold text-gray-900 dark:text-white">Configurações</h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Appearance Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Aparência
            </h2>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Tema
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Escolha entre tema claro ou escuro
                    </p>
                  </div>
                </div>

                {/* Theme Options */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Light Theme */}
                  <button
                    onClick={() => setTheme("light")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === "light"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center">
                        <Sun className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900 dark:text-white">
                          Claro
                        </div>
                        {theme === "light" && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Ativo
                          </div>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Dark Theme */}
                  <button
                    onClick={() => setTheme("dark")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === "dark"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Moon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900 dark:text-white">
                          Escuro
                        </div>
                        {theme === "dark" && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Ativo
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sobre
            </h2>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Versão:
                  </span>{" "}
                  1.0.0
                </p>
                <p>
                  <span className="font-medium text-gray-900 dark:text-white">
                    AI Assistant
                  </span>
                </p>
                <p className="mt-3">
                  Interface de chat com IA que suporta texto, imagens e documentos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}