import React from 'react';
import { MinimalHeader } from './components/layout/MinimalHeader';
import { InputHubPanel } from './components/studio/InputHubPanel';
import { PreviewExportPanel } from './components/studio/PreviewExportPanel';
import { PresenterModal } from './components/modals/PresenterModal';
import { AIGeneratorModal } from './components/modals/AIGeneratorModal';

export const App: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen bg-editor-bg text-editor-text overflow-hidden font-sans select-none">
      {/* Sleek Minimal Header */}
      <MinimalHeader />

      {/* Clean 2-Panel Presentation Studio */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Input & Upload Hub (45% width) */}
        <InputHubPanel className="w-[45%]" />

        {/* Right Panel: Live Preview & Export Hub (55% width) */}
        <PreviewExportPanel className="w-[55%]" />
      </main>

      {/* Global Modals */}
      <PresenterModal />
      <AIGeneratorModal />
    </div>
  );
};

export default App;
