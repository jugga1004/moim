'use client';

import { useEffect, useState } from 'react';

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);

  useEffect(() => {
    // 이미 설치됐으면 표시 안 함
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true);
    if (isStandalone) return;

    // 닫기 버튼 눌렀으면 7일간 표시 안 함
    const dismissed = localStorage.getItem('installBannerDismissed');
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
    setIsIOS(ios);

    if (ios) {
      setShow(true);
      return;
    }

    // Android / Chrome - beforeinstallprompt 이벤트 캐치
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> });
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    localStorage.setItem('installBannerDismissed', String(Date.now()));
    setShow(false);
    setShowIOSGuide(false);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  }

  if (!show) return null;

  return (
    <>
      {/* 배너 */}
      <div className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-3">
        <div className="text-2xl flex-shrink-0">📱</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">앱으로 설치하기</p>
          <p className="text-xs text-indigo-200 mt-0.5">홈 화면에 추가하면 앱처럼 사용할 수 있어요</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isIOS ? (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="bg-white text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition"
            >
              방법 보기
            </button>
          ) : (
            <button
              onClick={handleInstall}
              className="bg-white text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition"
            >
              설치
            </button>
          )}
          <button onClick={dismiss} className="text-indigo-200 hover:text-white text-lg leading-none">×</button>
        </div>
      </div>

      {/* iOS 안내 모달 */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4" onClick={() => setShowIOSGuide(false)}>
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-6 mb-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-800 text-lg">홈 화면에 추가하기</h2>
              <button onClick={() => setShowIOSGuide(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-indigo-600 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">Safari 하단 공유 버튼 탭</p>
                  <p className="text-xs text-gray-400 mt-0.5">화면 아래 가운데 <span className="font-semibold">□↑</span> 아이콘</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-indigo-600 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">스크롤하여 <span className="text-indigo-600">홈 화면에 추가</span> 선택</p>
                  <p className="text-xs text-gray-400 mt-0.5">목록에서 집 모양 아이콘 찾기</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-indigo-600 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">오른쪽 상단 <span className="text-indigo-600">추가</span> 버튼 탭</p>
                  <p className="text-xs text-gray-400 mt-0.5">홈 화면에 모임기록 앱이 추가돼요</p>
                </div>
              </li>
            </ol>

            <div className="mt-5 bg-amber-50 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-700">⚠️ Safari 브라우저에서만 홈 화면 추가가 가능합니다. Chrome·카카오 내부 브라우저에서는 지원되지 않아요.</p>
            </div>

            <button
              onClick={dismiss}
              className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
