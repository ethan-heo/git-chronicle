const CONTROL_CONTAINER_CLASS_NAME = 'note-preview-mermaid-zoom-controls';
const CONTROL_BUTTON_CLASS_NAME = 'note-preview-mermaid-zoom-button';
const STAGE_CLASS_NAME = 'note-preview-mermaid-stage';
const MIN_SCALE = 1;
const MAX_SCALE = 2;
const SCALE_STEP = 0.2;

const FIT_VIEW_ICON = `
  <svg class="note-preview-mermaid-zoom-fit-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M6 2.5H2.5V6" />
    <path d="M2.5 2.5 6 6" />
    <path d="M10 2.5h3.5V6" />
    <path d="M10 6 13.5 2.5" />
    <path d="M6 13.5H2.5V10" />
    <path d="M2.5 13.5 6 10" />
    <path d="M10 13.5h3.5V10" />
    <path d="M10 10 13.5 13.5" />
  </svg>
`;

function createControlButton(label: string, contents: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = CONTROL_BUTTON_CLASS_NAME;
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.title = label;
  button.innerHTML = contents;
  button.addEventListener('click', onClick);
  return button;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getViewportHeight(container: HTMLElement, svg: SVGSVGElement): number {
  const viewBox = svg.viewBox.baseVal;
  if (container.clientWidth > 0 && viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return Math.min(container.clientWidth * (viewBox.height / viewBox.width), 480);
  }

  const rect = svg.getBoundingClientRect();
  return Math.min(rect.height || 320, 480);
}

export function attachMermaidPanZoom(container: HTMLElement): () => void {
  const svg = container.querySelector('svg');
  if (!(svg instanceof SVGSVGElement)) {
    return () => {};
  }

  const originalMarkup = container.innerHTML;
  const viewportHeight = getViewportHeight(container, svg);
  container.classList.add('note-preview-mermaid-viewport');
  container.style.height = `${viewportHeight}px`;

  const stage = document.createElement('div');
  stage.className = STAGE_CLASS_NAME;

  const svgClone = svg.cloneNode(true);
  if (!(svgClone instanceof SVGSVGElement)) {
    return () => {};
  }
  svgClone.style.maxWidth = '100%';
  svgClone.style.maxHeight = '100%';
  svgClone.style.width = 'auto';
  svgClone.style.height = 'auto';
  svgClone.style.display = 'block';

  stage.append(svgClone);
  container.replaceChildren(stage);

  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let panStartX = 0;
  let panStartY = 0;
  let isDragging = false;

  const applyTransform = (): void => {
    stage.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  };

  const resetView = (): void => {
    scale = 1;
    offsetX = 0;
    offsetY = 0;
    applyTransform();
  };

  const zoomBy = (delta: number): void => {
    scale = clamp(Number((scale + delta).toFixed(3)), MIN_SCALE, MAX_SCALE);
    if (scale === 1) {
      offsetX = 0;
      offsetY = 0;
    }
    applyTransform();
  };

  const onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? SCALE_STEP : -SCALE_STEP);
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || scale <= 1) {
      return;
    }

    isDragging = true;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    panStartX = offsetX;
    panStartY = offsetY;
    stage.setPointerCapture(event.pointerId);
    container.classList.add('note-preview-mermaid-panning');
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!isDragging) {
      return;
    }

    offsetX = panStartX + (event.clientX - pointerStartX);
    offsetY = panStartY + (event.clientY - pointerStartY);
    applyTransform();
  };

  const stopDragging = (event?: PointerEvent): void => {
    if (!isDragging) {
      return;
    }

    isDragging = false;
    if (event) {
      stage.releasePointerCapture(event.pointerId);
    }
    container.classList.remove('note-preview-mermaid-panning');
  };

  stage.addEventListener('wheel', onWheel, { passive: false });
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', stopDragging);
  stage.addEventListener('pointercancel', stopDragging);
  stage.addEventListener('pointerleave', () => {
    if (!isDragging) {
      return;
    }
  });

  const controls = document.createElement('div');
  controls.className = CONTROL_CONTAINER_CLASS_NAME;
  controls.setAttribute('role', 'toolbar');
  controls.setAttribute('aria-label', 'Diagram controls');

  const zoomInButton = createControlButton('Zoom in', '+', () => zoomBy(SCALE_STEP));
  const zoomOutButton = createControlButton('Zoom out', '-', () => zoomBy(-SCALE_STEP));
  const fitButton = createControlButton('Fit view', FIT_VIEW_ICON, resetView);

  controls.append(zoomInButton, zoomOutButton, fitButton);
  container.append(controls);
  resetView();

  return () => {
    stage.removeEventListener('wheel', onWheel);
    stage.removeEventListener('pointerdown', onPointerDown);
    stage.removeEventListener('pointermove', onPointerMove);
    stage.removeEventListener('pointerup', stopDragging);
    stage.removeEventListener('pointercancel', stopDragging);
    container.classList.remove('note-preview-mermaid-panning');
    container.innerHTML = originalMarkup;
    container.style.removeProperty('height');
  };
}
