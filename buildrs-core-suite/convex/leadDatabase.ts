import { v } from "convex/values";
import { query } from "./_generated/server";

export const getEnrichedContacts = query({
  args: {
    search: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
    clientId: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.string()),
  },
  returns: v.object({
    data: v.array(v.object({
      id: v.string(),
      contact_id: v.optional(v.string()),
      first_name: v.optional(v.string()),
      last_name: v.optional(v.string()),
      email: v.optional(v.string()),
      mobile_phone: v.optional(v.string()),
      status: v.optional(v.string()),
      company_name: v.optional(v.string()),
      domain: v.optional(v.string()),
      website: v.optional(v.string()),
      linkedin_url: v.optional(v.string()),
      job_title: v.optional(v.string()),
      function_group: v.optional(v.string()),
      industry: v.optional(v.string()),
      industry_label: v.optional(v.string()),
      subindustry_label: v.optional(v.string()),
      employee_count: v.optional(v.number()),
      company_size: v.optional(v.number()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      country: v.optional(v.string()),
      company_city: v.optional(v.string()),
      company_state: v.optional(v.string()),
      company_country: v.optional(v.string()),
      contact_city: v.optional(v.string()),
      contact_state: v.optional(v.string()),
      contact_country: v.optional(v.string()),
    })),
    count: v.number(),
    page: v.number(),
    pageSize: v.number(),
    totalPages: v.number(),
  }),
  handler: async (ctx, args) => {
    const {
      search = "",
      page = 1,
      pageSize = 25,
      clientId,
      sortBy = "created_at",
      sortOrder = "desc"
    } = args;

    // For now, return mock data that matches the expected structure
    const mockContacts = [
      {
        id: "1",
        contact_id: "c1",
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        mobile_phone: "+31612345678",
        status: "cold",
        company_name: "Example Corp",
        domain: "example.com",
        website: "example.com",
        linkedin_url: "https://linkedin.com/in/johndoe",
        job_title: "Marketing Manager",
        function_group: "Marketing Decision Makers",
        industry: "Technology",
        industry_label: "Software",
        subindustry_label: "SaaS",
        employee_count: 150,
        company_size: 150,
        city: "Amsterdam",
        state: "Noord-Holland", 
        country: "Netherlands",
        company_city: "Amsterdam",
        company_state: "Noord-Holland",
        company_country: "Netherlands",
        contact_city: "Amsterdam",
        contact_state: "Noord-Holland", 
        contact_country: "Netherlands"
      },
      {
        id: "2",
        contact_id: "c2",
        first_name: "Jane",
        last_name: "Smith", 
        email: "jane.smith@techcorp.com",
        mobile_phone: "+31687654321",
        status: "warm",
        company_name: "TechCorp",
        domain: "techcorp.com",
        website: "techcorp.com",
        linkedin_url: "https://linkedin.com/in/janesmith",
        job_title: "Sales Director",
        function_group: "Sales Decision Makers",
        industry: "Technology",
        industry_label: "Technology",
        subindustry_label: "Cloud Services",
        employee_count: 500,
        company_size: 500,
        city: "Rotterdam",
        state: "Zuid-Holland",
        country: "Netherlands", 
        company_city: "Rotterdam",
        company_state: "Zuid-Holland",
        company_country: "Netherlands",
        contact_city: "Rotterdam",
        contact_state: "Zuid-Holland",
        contact_country: "Netherlands"
      }
    ];

    // Apply search filter
    let filteredContacts = mockContacts;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredContacts = mockContacts.filter(contact => 
        contact.first_name?.toLowerCase().includes(searchLower) ||
        contact.last_name?.toLowerCase().includes(searchLower) ||
        contact.company_name?.toLowerCase().includes(searchLower) ||
        contact.job_title?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const total = filteredContacts.length;
    const offset = (page - 1) * pageSize;
    const paginatedContacts = filteredContacts.slice(offset, offset + pageSize);

    return {
      data: paginatedContacts,
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  },
});

export const getFilterOptions = query({
  args: {},
  returns: v.object({
    functionGroups: v.array(v.string()),
    industryLabels: v.array(v.string()),
    subindustryLabels: v.array(v.string()),
    locations: v.array(v.string()),
  }),
  handler: async (ctx) => {
    // Return mock filter options
    return {
      functionGroups: [
        "Marketing Decision Makers",
        "Sales Decision Makers", 
        "IT Decision Makers",
        "Finance Decision Makers",
        "HR Decision Makers",
        "Operations Decision Makers"
      ],
      industryLabels: [
        "Technology",
        "Software", 
        "Healthcare",
        "Financial Services",
        "Manufacturing",
        "Retail",
        "Education",
        "Professional Services"
      ],
      subindustryLabels: [
        "SaaS",
        "Cloud Services",
        "Cybersecurity",
        "E-commerce",
        "Fintech",
        "Healthcare IT",
        "EdTech",
        "Consulting"
      ],
      locations: [
        "Netherlands",
        "Amsterdam, Netherlands",
        "Rotterdam, Netherlands", 
        "Utrecht, Netherlands",
        "Den Haag, Netherlands",
        "Eindhoven, Netherlands",
        "Tilburg, Netherlands",
        "Groningen, Netherlands"
      ]
    };
  },
});