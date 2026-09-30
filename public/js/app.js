function showChartTooltip(evt, label, value, chartId) {
  const tip = document.getElementById('tooltip-' + chartId);
  if (!tip) return;
  const wrap = tip.parentElement.querySelector('svg');
  const wrapRect = wrap.getBoundingClientRect();
  tip.textContent = label + ': ' + value;
  tip.style.left = (evt.clientX - wrapRect.left) + 'px';
  tip.style.top = (evt.clientY - wrapRect.top) + 'px';
  tip.style.display = 'block';
}

function hideChartTooltip(chartId) {
  const tip = document.getElementById('tooltip-' + chartId);
  if (tip) tip.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  // Confirm before destructive actions
  document.querySelectorAll('[data-confirm]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      const msg = form.getAttribute('data-confirm');
      if (!window.confirm(msg)) e.preventDefault();
    });
  });

  // Add price tier row in product form
  const addTierBtn = document.getElementById('add-tier');
  if (addTierBtn) {
    addTierBtn.addEventListener('click', () => {
      const wrap = document.getElementById('tiers-wrap');
      const row = document.createElement('div');
      row.className = 'tier-row';
      row.innerHTML = `
        <input type="number" name="tierQty" placeholder="Mua từ (số lượng)" min="1" required />
        <input type="number" name="tierPrice" placeholder="Giá bán (đ)" min="0" required />
        <button type="button" class="btn btn-sm remove-row">Xóa</button>
      `;
      wrap.appendChild(row);
    });
  }

  // Add spec row in product form
  const addSpecBtn = document.getElementById('add-spec');
  if (addSpecBtn) {
    addSpecBtn.addEventListener('click', () => {
      const wrap = document.getElementById('specs-wrap');
      const row = document.createElement('div');
      row.className = 'tier-row';
      row.innerHTML = `
        <input type="text" name="specKey" placeholder="Tên thông số" />
        <input type="text" name="specValue" placeholder="Giá trị" />
        <button type="button" class="btn btn-sm remove-row">Xóa</button>
      `;
      wrap.appendChild(row);
    });
  }

  document.querySelectorAll('#tiers-wrap, #specs-wrap').forEach((wrap) => {
    wrap.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-row')) {
        e.target.closest('.tier-row').remove();
      }
    });
  });

  // Toggle variant inputs
  const hasVariants = document.getElementById('hasVariants');
  if (hasVariants) {
    hasVariants.addEventListener('change', () => {
      document.getElementById('variants-wrap').style.display = hasVariants.checked ? 'grid' : 'none';
    });
  }

  // Auto submit filter forms on select change
  document.querySelectorAll('.auto-submit select').forEach((sel) => {
    sel.addEventListener('change', () => sel.closest('form').submit());
  });

  // AI suggestion for product name
  const suggestNameBtn = document.getElementById('suggest-name-btn');
  if (suggestNameBtn) {
    suggestNameBtn.addEventListener('click', async () => {
      const nameInput = document.getElementById('product-name');
      const unit = document.getElementById('product-unit').value;
      suggestNameBtn.textContent = 'Đang tạo gợi ý...';
      try {
        const res = await fetch('/products/suggest-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: nameInput.value, unit })
        });
        const data = await res.json();
        const wrap = document.getElementById('name-suggestions');
        wrap.innerHTML = '';
        data.suggestions.forEach((s) => {
          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'btn btn-sm';
          item.style.textAlign = 'left';
          item.textContent = s;
          item.addEventListener('click', () => { nameInput.value = s; wrap.style.display = 'none'; });
          wrap.appendChild(item);
        });
        wrap.style.display = 'flex';
      } finally {
        suggestNameBtn.textContent = '✨ Gợi ý tên bằng AI';
      }
    });
  }

  // AI suggestion for product description
  const suggestDescBtn = document.getElementById('suggest-desc-btn');
  if (suggestDescBtn) {
    suggestDescBtn.addEventListener('click', async () => {
      const nameInput = document.getElementById('product-name');
      const categoryId = document.getElementById('product-category').value;
      const unit = document.getElementById('product-unit').value;
      suggestDescBtn.textContent = 'Đang tạo gợi ý...';
      try {
        const res = await fetch('/products/suggest-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nameInput.value, categoryId, unit })
        });
        const data = await res.json();
        document.getElementById('product-description').value = data.description;
      } finally {
        suggestDescBtn.textContent = '✨ Gợi ý mô tả bằng AI';
      }
    });
  }
});
