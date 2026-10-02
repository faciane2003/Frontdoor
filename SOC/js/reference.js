// Controls the reference tabs, table of contents, search, and sample incident trace.

// Cache permanent controls once. This reference is a static document, so
// repeatedly querying the same elements would only add overhead.
const tabs = document.querySelectorAll(".tab-button");
const panels = document.querySelectorAll(".tab-panel");
const traceButtons = document.querySelectorAll(".trace-button");
const traceNodes = document.querySelectorAll(".trace-node");
const accordionToggles = document.querySelectorAll(".accordion-toggle");
const navToggles = document.querySelectorAll(".nav-toggle");
const searchInput = document.getElementById("pageSearch");
const searchMeta = document.getElementById("searchMeta");
const searchPrev = document.getElementById("searchPrev");
const searchNext = document.getElementById("searchNext");
const sectionSelect = document.getElementById("socSectionSelect");
const docBackLink = document.getElementById("docBackLink");
const sidebar = document.querySelector(".sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const sidebarToggle = document.getElementById("sidebarToggle");
const contentPane = document.querySelector(".content-pane");
const mobileViewport = window.matchMedia("(max-width: 1120px)");
const MOBILE_SIDEBAR_OPEN_LABEL = "<";
const MOBILE_SIDEBAR_CLOSED_LABEL = ">";

// Each trace state shows how evidence accumulates during a sample incident.
const traceStates = [
  {
    active: ["host"],
    text: "Step 1: User or malware activity begins on the host before the network boundary sees anything."
  },
  {
    active: ["host", "sysmon"],
    text: "Step 2: The process launches. Host telemetry starts showing command line, parent process, and user context."
  },
  {
    active: ["host", "sysmon", "fw"],
    text: "Step 3: The host reaches out. OPNsense now has source, destination, port, and allow or deny evidence."
  },
  {
    active: ["host", "sysmon", "fw", "suricata", "zeek"],
    text: "Step 4: Network sensors observe the same event from different angles: Suricata for alerts, Zeek for metadata."
  },
  {
    active: ["host", "sysmon", "fw", "suricata", "zeek", "splunk"],
    text: "Step 5: Splunk ingests and correlates the host and network evidence into a triageable signal."
  },
  {
    active: ["host", "sysmon", "fw", "suricata", "zeek", "splunk"],
    text: "Step 6: The analyst pivots across host, network, and identity context to determine scope and response."
  }
];

const traceReadout = document.getElementById("traceReadout");
const searchableRoot = document.querySelector(".content-pane");
let searchHits = [];
let activeSearchHitIndex = -1;
// Expand acronyms in readable content while leaving code and navigation alone.
const acronymMap = {
  "IR": "Incident Response",
  "SIEM": "Security Information and Event Management",
  "SOAR": "Security Orchestration, Automation, and Response",
  "EDR": "Endpoint Detection and Response",
  "XDR": "Extended Detection and Response",
  "IOC": "Indicator of Compromise",
  "TTP": "Tactics, Techniques, and Procedures",
  "IDS": "Intrusion Detection System",
  "IPS": "Intrusion Prevention System",
  "WAF": "Web Application Firewall",
  "NAC": "Network Access Control",
  "SASE": "Secure Access Service Edge",
  "CIDR": "Classless Inter-Domain Routing",
  "OSI": "Open Systems Interconnection",
  "TCP": "Transmission Control Protocol",
  "UDP": "User Datagram Protocol",
  "DNS": "Domain Name System",
  "DHCP": "Dynamic Host Configuration Protocol",
  "ARP": "Address Resolution Protocol",
  "VLAN": "Virtual Local Area Network",
  "RDP": "Remote Desktop Protocol",
  "SSH": "Secure Shell",
  "SMB": "Server Message Block",
  "NAT": "Network Address Translation",
  "HTTP": "Hypertext Transfer Protocol",
  "HTTPS": "Hypertext Transfer Protocol Secure",
  "FTP": "File Transfer Protocol",
  "SFTP": "SSH File Transfer Protocol",
  "SMTP": "Simple Mail Transfer Protocol",
  "IMAP": "Internet Message Access Protocol",
  "POP3": "Post Office Protocol Version 3",
  "RPC": "Remote Procedure Call",
  "LDAP": "Lightweight Directory Access Protocol",
  "LDAPS": "Lightweight Directory Access Protocol Secure",
  "NTP": "Network Time Protocol",
  "TLS": "Transport Layer Security",
  "CA": "Certificate Authority",
  "MFA": "Multi-Factor Authentication",
  "IAM": "Identity and Access Management",
  "AD": "Active Directory",
  "GPO": "Group Policy Object",
  "API": "Application Programming Interface",
  "IP": "Internet Protocol",
  "URL": "Uniform Resource Locator",
  "GUI": "Graphical User Interface",
  "CLI": "Command-Line Interface",
  "CSV": "Comma-Separated Values",
  "JSON": "JavaScript Object Notation",
  "KEV": "Known Exploited Vulnerabilities",
  "CSP": "Content Security Policy",
  "CSRF": "Cross-Site Request Forgery",
  "XSS": "Cross-Site Scripting",
  "SQL": "Structured Query Language",
  "NIST": "National Institute of Standards and Technology"
};

// Expand acronyms in readable content while preserving controls and code examples.
function expandAcronyms() {
  if (!searchableRoot) {
    return;
  }

  const keys = Object.keys(acronymMap).sort((a, b) => b.length - a.length);
  const pattern = new RegExp("\\b(" + keys.map(escapeRegExp).join("|") + ")\\b", "g");
  const walker = document.createTreeWalker(searchableRoot, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (!parent) {
      continue;
    }

    if (
      parent.closest("script, style, code, pre, #acronyms") ||
      parent.closest(".logo-meta, .phase, .band-label, .accordion-icon, .toc-link") ||
      parent.classList.contains("acronym-inline")
    ) {
      continue;
    }

    if (!node.textContent || !pattern.test(node.textContent)) {
      pattern.lastIndex = 0;
      continue;
    }

    pattern.lastIndex = 0;
    textNodes.push(node);
  }

  textNodes.forEach((node) => {
    const parent = node.parentNode;
    if (!parent) {
      return;
    }

    const fragment = document.createDocumentFragment();
    const text = node.textContent || "";
    let lastIndex = 0;
    let match;

    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      const token = match[0];
      const wrapper = document.createElement("span");
      wrapper.className = "acronym-inline";
      wrapper.innerHTML = token + "<small>(" + acronymMap[token] + ")</small>";
      fragment.appendChild(wrapper);
      lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    parent.replaceChild(fragment, node);
  });
}

// Search highlights use mark elements so results can be navigated without
// changing the underlying reference content.
// Remove old highlights before applying a new search.
function clearSearchHighlights() {
  const hits = searchableRoot.querySelectorAll("mark.search-hit");
  hits.forEach((hit) => {
    const parent = hit.parentNode;
    if (!parent) {
      return;
    }
    parent.replaceChild(document.createTextNode(hit.textContent), hit);
    parent.normalize();
  });

  searchHits = [];
  activeSearchHitIndex = -1;
  updateSearchNavigation();
}

// Treat the search text literally instead of interpreting it as a regular expression.
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Mark matching text and remember hits for previous/next navigation.
function highlightMatches(query) {
  clearSearchHighlights();

  const trimmed = query.trim();
  if (!trimmed) {
    searchMeta.textContent = "";
    return;
  }

  const regex = new RegExp(escapeRegExp(trimmed), "gi");
  const walker = document.createTreeWalker(searchableRoot, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (!parent || !node.textContent || !node.textContent.trim()) {
      continue;
    }

    if (
      parent.closest("script, style") ||
      parent.closest(".tab-button, .toc-link, .search-wrap") ||
      parent.closest("mark.search-hit")
    ) {
      continue;
    }

    if (!regex.test(node.textContent)) {
      regex.lastIndex = 0;
      continue;
    }

    regex.lastIndex = 0;
    textNodes.push(node);
  }

  textNodes.forEach((node) => {
    const parent = node.parentNode;
    if (!parent) {
      return;
    }

    const fragment = document.createDocumentFragment();
    const text = node.textContent || "";
    let lastIndex = 0;
    let match;

    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      const mark = document.createElement("mark");
      mark.className = "search-hit";
      mark.textContent = match[0];
      fragment.appendChild(mark);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    parent.replaceChild(fragment, node);
  });

  searchHits = [...searchableRoot.querySelectorAll("mark.search-hit")];
  updateSearchMeta();
  updateSearchNavigation();

  if (searchHits.length > 0) {
    activateSearchHit(0);
  }
}

// Show the current match position and total in the search controls.
function updateSearchMeta() {
  if (!searchInput) {
    return;
  }

  const trimmed = searchInput.value.trim();
  if (!trimmed) {
    searchMeta.textContent = "";
    return;
  }

  if (searchHits.length === 0) {
    searchMeta.textContent = "No matches";
    return;
  }

  searchMeta.textContent = (activeSearchHitIndex + 1) + " of " + searchHits.length + " matches";
}

// Enable or disable previous/next controls based on available matches.
function updateSearchNavigation() {
  const hasHits = searchHits.length > 0;

  if (searchPrev) {
    searchPrev.disabled = !hasHits;
  }

  if (searchNext) {
    searchNext.disabled = !hasHits;
  }
}

// Find the tab containing a section or search result.
function getPanelIdForElement(element) {
  const panel = element.closest(".tab-panel");
  return panel ? panel.id : null;
}

// Turn a heading into a stable, readable deep-link identifier.
function slugify(value) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Remove existing numbering before the hierarchy is numbered again.
function stripNumericPrefix(value) {
  return (value || "").replace(/^\d+(?:\.\d+)*\s+/, "").trim();
}

// Reuse each sidebar group theme in the table of contents.
function getThemeClassForGroup(group) {
  if (!group) {
    return "theme-research";
  }

  if (group.classList.contains("chapter-core")) return "theme-soc";
  if (group.classList.contains("chapter-network")) return "theme-network";
  if (group.classList.contains("chapter-environment")) return "theme-lab";
  if (group.classList.contains("chapter-systems")) return "theme-script";
  if (group.classList.contains("chapter-operations")) return "theme-incident";
  if (group.classList.contains("chapter-reference")) return "theme-research";
  return "theme-research";
}

// Derive hierarchy numbers from DOM order so reordered content never needs
// manual renumbering.
// Number the document from its actual headings so inserted sections stay in order.
function applyHierarchyNumbers() {
  const chapterGroups = document.querySelectorAll(".nav-group");

  chapterGroups.forEach((group, chapterIndex) => {
    const chapterNumber = String(chapterIndex + 1);
    const label = group.querySelector(".nav-label");

    if (label) {
      const baseLabel = label.dataset.baseLabel || stripNumericPrefix(label.textContent);
      label.dataset.baseLabel = baseLabel;
      label.textContent = chapterNumber + ". " + baseLabel;
    }

    const chapterTabs = group.querySelectorAll(":scope .nav-items > .tab-button");
    chapterTabs.forEach((tab, tabIndex) => {
      const panel = document.getElementById(tab.dataset.tab);
      const tabNumber = chapterNumber + "." + (tabIndex + 1);
      const baseTabLabel = tab.dataset.baseLabel || stripNumericPrefix(tab.textContent);
      tab.dataset.baseLabel = baseTabLabel;
      tab.dataset.number = tabNumber;
      tab.textContent = tabNumber + " " + baseTabLabel;

      if (!panel) {
        return;
      }

      panel.dataset.number = tabNumber;
      panel.dataset.themeClass = getThemeClassForGroup(group);

      const sectionCards = panel.querySelectorAll(":scope .section-card.is-collapsible");
      sectionCards.forEach((card, sectionIndex) => {
        const heading = card.querySelector(":scope > .section-title h3");
        const sectionNumber = tabNumber + "." + (sectionIndex + 1);

        if (heading) {
          const baseHeading = heading.dataset.baseLabel || stripNumericPrefix(heading.textContent);
          heading.dataset.baseLabel = baseHeading;
          heading.textContent = sectionNumber + " " + baseHeading;
        }

        card.dataset.number = sectionNumber;

        const accordionItems = card.querySelectorAll(".accordion-item");
        accordionItems.forEach((item, itemIndex) => {
          const strong = item.querySelector(".accordion-toggle strong");
          if (!strong) {
            return;
          }

          const itemNumber = sectionNumber + "." + (itemIndex + 1);
          const baseStrong = strong.dataset.baseLabel || stripNumericPrefix(strong.textContent);
          strong.dataset.baseLabel = baseStrong;
          strong.textContent = itemNumber + " " + baseStrong;
          item.dataset.number = itemNumber;
        });
      });
    });
  });
}

// Update accordion visibility and its accessibility state together.
function setAccordionItemOpen(item, open) {
  if (!item) {
    return;
  }

  item.classList.toggle("open", open);
  const toggle = item.querySelector(".accordion-toggle");
  if (toggle) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }
}

// Open a section card and reflect its state in its heading control.
function setSectionCardOpen(card, open) {
  if (!card) {
    return;
  }

  if (open) {
    document.querySelectorAll(".section-card.is-collapsible").forEach((otherCard) => {
      if (otherCard === card) {
        return;
      }

      otherCard.classList.add("is-collapsed");
      const otherTitle = otherCard.querySelector(":scope > .section-title");
      if (otherTitle) {
        otherTitle.setAttribute("aria-expanded", "false");
      }
    });
  }

  card.classList.toggle("is-collapsed", !open);
  const title = card.querySelector(":scope > .section-title");
  if (title) {
    title.setAttribute("aria-expanded", open ? "true" : "false");
  }
}

// Open every collapsed ancestor needed to reveal a target.
function expandSectionForElement(element) {
  if (!element) {
    return;
  }

  const sectionCard = element.closest(".section-card.is-collapsible");
  if (sectionCard) {
    setSectionCardOpen(sectionCard, true);
  }

  const accordionItem = element.closest(".accordion-item");
  if (accordionItem) {
    setAccordionItemOpen(accordionItem, true);
  }
}

// Reveal a target inside the scrolling document pane.
function scrollElementIntoView(element) {
  if (!element) {
    return;
  }

  requestAnimationFrame(() => {
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest"
    });
  });
}

// Move an expanded section beneath the sticky document header.
function scrollExpandedElementToTop(element) {
  if (!element) {
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scrollElementIntoView(element);
    });
  });
}

// Activate the correct tab and reveal the requested section or accordion.
function openTabTarget(tabId, targetId, accordionId) {
  expandGroupForTab(tabId);
  setActiveTab(tabId);

  const panel = document.getElementById(tabId);
  if (!panel) {
    return;
  }

  const target = targetId ? document.getElementById(targetId) : panel;
  const accordionTarget = accordionId ? document.getElementById(accordionId) : null;

  if (target) {
    expandSectionForElement(target);
  }

  if (accordionTarget) {
    expandSectionForElement(accordionTarget);
  }

  scrollElementIntoView(accordionTarget || target || panel);
  closeMobileSidebar();
}

// Give section headings consistent mouse and keyboard expansion behavior.
function initializeCollapsibleSections() {
  const sectionCards = document.querySelectorAll(".section-card");

  sectionCards.forEach((card, cardIndex) => {
    const title = card.querySelector(":scope > .section-title");
    if (!title) {
      return;
    }

    const panelId = getPanelIdForElement(card) || "section";
    const heading = title.querySelector("h3");
    const titleText = heading ? heading.textContent.trim() : "section-" + (cardIndex + 1);
    const cardId = card.id || panelId + "-" + slugify(titleText || "section-" + (cardIndex + 1));
    card.id = cardId;

    let body = card.querySelector(":scope > .section-body");
    if (!body) {
      body = document.createElement("div");
      body.className = "section-body";

      while (title.nextSibling) {
        body.appendChild(title.nextSibling);
      }

      card.appendChild(body);
    }

    card.classList.add("is-collapsible", "is-collapsed");

    if (!title.querySelector(".section-caret")) {
      const caret = document.createElement("span");
      caret.className = "section-caret";
      caret.setAttribute("aria-hidden", "true");
      caret.textContent = "▾";
      title.appendChild(caret);
    }

    title.setAttribute("role", "button");
    title.setAttribute("tabindex", "0");
    title.setAttribute("aria-expanded", "false");
    body.id = cardId + "-body";
    title.setAttribute("aria-controls", body.id);

    title.addEventListener("click", () => {
      const isCollapsed = card.classList.contains("is-collapsed");
      setSectionCardOpen(card, isCollapsed);
      if (isCollapsed) {
        scrollExpandedElementToTop(card);
      }
    });

    title.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const isCollapsed = card.classList.contains("is-collapsed");
        setSectionCardOpen(card, isCollapsed);
        if (isCollapsed) {
          scrollExpandedElementToTop(card);
        }
      }
    });
  });
}

// Read a usable heading for an accordion, with a fallback label.
function getAccordionLabel(item, index) {
  const strong = item.querySelector(".accordion-toggle strong");
  if (strong && strong.textContent.trim()) {
    return strong.dataset.baseLabel || stripNumericPrefix(strong.textContent);
  }

  const text = item.querySelector(".accordion-toggle span");
  if (text && text.textContent.trim()) {
    return stripNumericPrefix(text.textContent);
  }

  return "Step " + (index + 1);
}

// Build section links from authored headings instead of maintaining a second index.
function buildSidebarDeepLinks() {
  document.querySelectorAll(".nav-subitems").forEach((node) => node.remove());

  tabs.forEach((tab) => {
    const tabId = tab.dataset.tab;
    const panel = document.getElementById(tabId);
    if (!panel || !tab.parentElement) {
      return;
    }

    const cards = panel.querySelectorAll(".section-card.is-collapsible");
    if (!cards.length) {
      return;
    }

    const subitems = document.createElement("div");
    subitems.className = "nav-subitems is-collapsed";
    subitems.dataset.parentTab = tabId;

    cards.forEach((card) => {
      const heading = card.querySelector(":scope > .section-title h3");
      if (!heading) {
        return;
      }

      const sectionButton = document.createElement("button");
      sectionButton.className = "nav-subitem";
      sectionButton.type = "button";
      sectionButton.dataset.tab = tabId;
      sectionButton.dataset.target = card.id;
      sectionButton.textContent = heading.textContent.trim();
      subitems.appendChild(sectionButton);

      const accordionItems = card.querySelectorAll(".accordion-item");
      accordionItems.forEach((item, index) => {
        if (!item.id) {
          item.id = card.id + "-item-" + (index + 1);
        }

        const leafButton = document.createElement("button");
        leafButton.className = "nav-subitem is-leaf";
        leafButton.type = "button";
        leafButton.dataset.tab = tabId;
        leafButton.dataset.target = card.id;
        leafButton.dataset.accordionTarget = item.id;
        leafButton.textContent = (item.dataset.number ? item.dataset.number + " " : "") + getAccordionLabel(item, index);
        subitems.appendChild(leafButton);
      });
    });

    tab.insertAdjacentElement("afterend", subitems);
  });
}

// Build the compact table of contents directly from the authored panels.
// Create chapter and topic entries directly from the reference panels.
function buildTableOfContents() {
  const tocList = document.getElementById("tocList");
  if (!tocList) {
    return;
  }

  tocList.innerHTML = "";

  const chapterGroups = document.querySelectorAll(".nav-group");
  chapterGroups.forEach((group) => {
    const label = group.querySelector(".nav-label");
    if (!label) {
      return;
    }

    const tocCard = document.createElement("div");
    tocCard.className = "toc-card " + getThemeClassForGroup(group);

    const title = document.createElement("h4");
    title.textContent = label.textContent.trim();
    title.setAttribute("role", "button");
    title.setAttribute("tabindex", "0");
    title.setAttribute("aria-expanded", "false");
    tocCard.appendChild(title);

    const sublist = document.createElement("div");
    sublist.className = "toc-sublist";

    const chapterTabs = group.querySelectorAll(":scope .nav-items > .tab-button");
    chapterTabs.forEach((tab) => {
      const panel = document.getElementById(tab.dataset.tab);
      const topic = document.createElement("div");
      topic.className = "toc-topic is-collapsed";
      const tocLink = document.createElement("button");
      tocLink.className = "toc-link";
      tocLink.type = "button";
      tocLink.textContent = tab.textContent.trim();
      tocLink.setAttribute("aria-expanded", "false");

      if (panel) {
        const cards = [...panel.querySelectorAll(":scope .section-card.is-collapsible")];

        const sectionList = document.createElement("div");
        sectionList.className = "toc-section-list";
        sectionList.hidden = true;

        cards.forEach((card) => {
          const heading = card.querySelector(":scope > .section-title h3");
          if (!heading) return;

          const sectionRow = document.createElement("button");
          sectionRow.className = "toc-section-row";
          sectionRow.type = "button";
          sectionRow.textContent = heading.textContent.trim();
          sectionRow.setAttribute("aria-expanded", "false");

          const sectionEntry = document.createElement("div");
          sectionEntry.className = "toc-section-entry is-collapsed";

          const sectionContent = document.createElement("div");
          sectionContent.className = "toc-section-content";
          sectionContent.hidden = true;

          const sectionMeta = card.querySelector(":scope > .section-title > span:not(.section-caret)");
          if (sectionMeta && sectionMeta.textContent.trim()) {
            const meta = document.createElement("small");
            meta.textContent = sectionMeta.textContent.trim();
            sectionRow.appendChild(meta);
          }

          sectionRow.addEventListener("click", () => {
            const shouldOpen = sectionEntry.classList.contains("is-collapsed");

            sectionList.querySelectorAll(":scope > .toc-section-entry").forEach((otherEntry) => {
              const otherRow = otherEntry.querySelector(":scope > .toc-section-row");
              const otherContent = otherEntry.querySelector(":scope > .toc-section-content");
              const isCurrent = otherEntry === sectionEntry;
              otherEntry.classList.toggle("is-collapsed", !isCurrent || !shouldOpen);
              if (otherRow) otherRow.setAttribute("aria-expanded", String(isCurrent && shouldOpen));
              if (otherContent) otherContent.hidden = !isCurrent || !shouldOpen;
            });

            if (shouldOpen && !sectionContent.hasChildNodes()) {
              const sourceBody = card.querySelector(":scope > .section-body");
              if (sourceBody) {
                const clone = sourceBody.cloneNode(true);
                clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
                clone.querySelectorAll("[aria-controls]").forEach((node) => node.removeAttribute("aria-controls"));
                clone.querySelectorAll(".accordion-toggle").forEach((toggle) => {
                  toggle.addEventListener("click", () => {
                    const item = toggle.closest(".accordion-item");
                    if (item) setAccordionItemOpen(item, !item.classList.contains("open"));
                  });
                });
                const clonedTraceButtons = [...clone.querySelectorAll(".trace-button")];
                const clonedTraceNodes = [...clone.querySelectorAll(".trace-node")];
                const clonedTraceReadout = clone.querySelector(".trace-readout");
                clonedTraceButtons.forEach((button, index) => {
                  button.addEventListener("click", () => {
                    const traceState = traceStates[index];
                    if (!traceState) return;
                    clonedTraceButtons.forEach((otherButton, buttonIndex) => {
                      otherButton.classList.toggle("active", buttonIndex === index);
                    });
                    clonedTraceNodes.forEach((node) => {
                      node.classList.toggle("active", traceState.active.includes(node.dataset.traceNode));
                    });
                    if (clonedTraceReadout) clonedTraceReadout.textContent = traceState.text;
                  });
                });
                sectionContent.appendChild(clone);
              }
            }
          });
          sectionEntry.appendChild(sectionRow);
          sectionEntry.appendChild(sectionContent);
          sectionList.appendChild(sectionEntry);
        });

        tocLink.addEventListener("click", () => {
          const shouldOpen = topic.classList.contains("is-collapsed");
          sublist.querySelectorAll(":scope > .toc-topic").forEach((otherTopic) => {
            const otherLink = otherTopic.querySelector(":scope > .toc-link");
            const otherSections = otherTopic.querySelector(":scope > .toc-section-list");
            const isCurrent = otherTopic === topic;
            otherTopic.classList.toggle("is-collapsed", !isCurrent || !shouldOpen);
            if (otherLink) otherLink.setAttribute("aria-expanded", String(isCurrent && shouldOpen));
            if (otherSections) otherSections.hidden = !isCurrent || !shouldOpen;
          });
        });

        topic.appendChild(tocLink);
        topic.appendChild(sectionList);
      } else {
        tocLink.addEventListener("click", () => openTabTarget(tab.dataset.tab));
        topic.appendChild(tocLink);
      }

      sublist.appendChild(topic);
    });

    tocCard.appendChild(sublist);
    tocCard.classList.add("is-collapsed");
    sublist.hidden = true;

    const toggleChapter = () => {
      const shouldOpen = tocCard.classList.contains("is-collapsed");

      tocList.querySelectorAll(".toc-card").forEach((otherCard) => {
        const otherTitle = otherCard.querySelector(":scope > h4");
        const otherSublist = otherCard.querySelector(":scope > .toc-sublist");
        const isCurrent = otherCard === tocCard;
        otherCard.classList.toggle("is-collapsed", !isCurrent || !shouldOpen);
        if (otherTitle) {
          otherTitle.setAttribute("aria-expanded", String(isCurrent && shouldOpen));
        }
        if (otherSublist) {
          otherSublist.hidden = !isCurrent || !shouldOpen;
        }
      });
    };

    title.addEventListener("click", toggleChapter);
    title.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleChapter();
      }
    });

    tocList.appendChild(tocCard);
  });
}

// Open the matching tab and collapsed sections before scrolling to a search result.
function activateSearchHit(index) {
  if (!searchHits.length) {
    return;
  }

  activeSearchHitIndex = (index + searchHits.length) % searchHits.length;
  searchHits.forEach((hit, hitIndex) => {
    hit.classList.toggle("is-active", hitIndex === activeSearchHitIndex);
  });

  const activeHit = searchHits[activeSearchHitIndex];
  const panelId = getPanelIdForElement(activeHit);

  if (panelId) {
    expandGroupForTab(panelId);
    setActiveTab(panelId);
  }

  expandSectionForElement(activeHit);

  requestAnimationFrame(() => {
    activeHit.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest"
    });
  });

  updateSearchMeta();
}

// Keep tab buttons, panels, and the compact section selector synchronized.
function setActiveTab(tabId) {
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabId);
  });

  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });

  if (sectionSelect && sectionSelect.value !== tabId) {
    sectionSelect.value = tabId;
  }

  document.querySelectorAll(".nav-subitems").forEach((subitems) => {
    subitems.classList.toggle("is-collapsed", subitems.dataset.parentTab !== tabId);
  });
}

// Reset the document pane when a different tab is opened.
function scrollTabToTop(tabId) {
  const activePanel = document.getElementById(tabId);
  const scrollTarget = activePanel || contentPane;

  if (!scrollTarget) {
    return;
  }

  const top = scrollTarget.getBoundingClientRect().top + window.scrollY - 12;
  window.scrollTo({
    top: Math.max(0, top),
    behavior: "smooth"
  });
}

// Reveal the sidebar group containing the active tab.
function expandGroupForTab(tabId) {
  const activeTab = [...tabs].find((tab) => tab.dataset.tab === tabId);
  const activeGroup = activeTab ? activeTab.closest(".nav-group") : null;

  if (!activeGroup) {
    return;
  }

  navToggles.forEach((otherToggle) => {
    const otherGroup = otherToggle.parentElement;
    if (!otherGroup || otherGroup === activeGroup) {
      return;
    }
    otherGroup.classList.add("is-collapsed");
  });

  activeGroup.classList.remove("is-collapsed");
}

// Adjust sidebar behavior when the viewport crosses the mobile breakpoint.
function syncMobileSidebar() {
  if (!sidebar || !sidebarToggle) {
    return;
  }

  const isMobile = mobileViewport.matches;
  if (isMobile) {
    sidebar.classList.add("is-mobile-collapsed");
    sidebarToggle.setAttribute("aria-expanded", "false");
    sidebarToggle.textContent = MOBILE_SIDEBAR_CLOSED_LABEL;
    sidebarToggle.setAttribute("aria-label", "Open navigation");
    sidebarToggle.setAttribute("title", "Open navigation");
    return;
  }

  sidebar.classList.remove("is-mobile-collapsed");
  sidebarToggle.setAttribute("aria-expanded", "true");
  sidebarToggle.textContent = MOBILE_SIDEBAR_OPEN_LABEL;
  sidebarToggle.setAttribute("aria-label", "Close navigation");
  sidebarToggle.setAttribute("title", "Close navigation");
}

// Close the mobile sidebar and restore its button and backdrop states.
function closeMobileSidebar() {
  if (!mobileViewport.matches || !sidebar || !sidebarToggle) {
    return;
  }

  sidebar.classList.add("is-mobile-collapsed");
  sidebarToggle.setAttribute("aria-expanded", "false");
  sidebarToggle.textContent = MOBILE_SIDEBAR_CLOSED_LABEL;
}

// Update the sample incident diagram and its explanation together.
function setTrace(index) {
  const state = traceStates[index];
  if (!state || !traceReadout) {
    return;
  }

  traceButtons.forEach((button, buttonIndex) => {
    button.classList.toggle("active", buttonIndex === index);
  });

  traceNodes.forEach((node) => {
    node.classList.toggle("active", state.active.includes(node.dataset.traceNode));
  });

  traceReadout.textContent = state.text;
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    expandGroupForTab(tab.dataset.tab);
    setActiveTab(tab.dataset.tab);
    scrollTabToTop(tab.dataset.tab);

    closeMobileSidebar();
  });
});

if (sectionSelect) {
  sectionSelect.addEventListener("change", () => {
    const tabId = sectionSelect.value;
    expandGroupForTab(tabId);
    setActiveTab(tabId);
    scrollTabToTop(tabId);
  });
}

traceButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    setTrace(index);
  });
});

accordionToggles.forEach((toggle) => {
  const item = toggle.parentElement;
  setAccordionItemOpen(item, false);
  toggle.addEventListener("click", () => {
    const isOpen = item.classList.contains("open");
    setAccordionItemOpen(item, !isOpen);
    if (!isOpen) {
      scrollExpandedElementToTop(item);
    }
  });
});

navToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const currentGroup = toggle.parentElement;
    if (!currentGroup) {
      return;
    }

    const shouldOpen = currentGroup.classList.contains("is-collapsed");
    if (!shouldOpen) {
      currentGroup.classList.add("is-collapsed");
      return;
    }

    navToggles.forEach((otherToggle) => {
      const otherGroup = otherToggle.parentElement;
      if (!otherGroup || otherGroup === currentGroup) {
        return;
      }
      otherGroup.classList.add("is-collapsed");
    });

    currentGroup.classList.remove("is-collapsed");
  });
});

if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener("click", () => {
    const isCollapsed = sidebar.classList.toggle("is-mobile-collapsed");
    sidebarToggle.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
    sidebarToggle.textContent = isCollapsed ? MOBILE_SIDEBAR_CLOSED_LABEL : MOBILE_SIDEBAR_OPEN_LABEL;
    sidebarToggle.setAttribute("aria-label", isCollapsed ? "Open navigation" : "Close navigation");
    sidebarToggle.setAttribute("title", isCollapsed ? "Open navigation" : "Close navigation");
  });
}

if (sidebarBackdrop) {
  sidebarBackdrop.addEventListener("click", () => {
    closeMobileSidebar();
  });
}

if (contentPane) {
  contentPane.addEventListener("click", () => {
    closeMobileSidebar();
  });
}

if (mobileViewport.addEventListener) {
  mobileViewport.addEventListener("change", syncMobileSidebar);
} else if (mobileViewport.addListener) {
  mobileViewport.addListener(syncMobileSidebar);
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    highlightMatches(searchInput.value);
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && searchHits.length > 0) {
      event.preventDefault();
      activateSearchHit(activeSearchHitIndex + (event.shiftKey ? -1 : 1));
    }
  });
}

if (searchPrev) {
  searchPrev.addEventListener("click", () => {
    activateSearchHit(activeSearchHitIndex - 1);
  });
}

if (searchNext) {
  searchNext.addEventListener("click", () => {
    activateSearchHit(activeSearchHitIndex + 1);
  });
}

if (docBackLink) {
  docBackLink.addEventListener("click", (event) => {
    if (window.history.length > 1) {
      event.preventDefault();
      window.history.back();
    }
  });
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest(".nav-subitem");
  if (!trigger) {
    return;
  }

  openTabTarget(trigger.dataset.tab, trigger.dataset.target, trigger.dataset.accordionTarget);
});

initializeCollapsibleSections();
applyHierarchyNumbers();
buildSidebarDeepLinks();
buildTableOfContents();
expandAcronyms();
syncMobileSidebar();
setActiveTab("toc");
setTrace(0);
